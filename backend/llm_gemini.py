import os
import json
from collections.abc import Callable
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv
from collections import deque

load_dotenv()


class ExecutionContext:
    """Context class to manage execution state and conversation flow"""

    def __init__(self):
        self.session_context: str = ""
        self.current_conversation: List[Dict] = []
        self.function_called: List[Dict] = []
        self.pending_function_call: Optional[Dict] = None
        self.user_question: str = ""

    def add_user_message(self, content: str):
        """Add user message to conversation"""
        self.current_conversation.append({"role": "user", "content": content})
        self.user_question = content

    def add_assistant_message(self, content: str):
        """Add assistant message to conversation"""
        self.current_conversation.append({"role": "assistant", "content": content})

    def add_function_call(self, name: str, args: Dict[str, Any], result: Dict[str, Any] = None):
        """Add function call to context"""
        self.session_context += f"\nFunction call: {name}({args})\n"
        if result:
            self.session_context += f"Result: {json.dumps(result)}\n"
            self.current_conversation.append({
                "role": "function",
                "name": name,
                "content": json.dumps(result)
            })

        function_entry = {
            "call": name,
            "args": args
        }
        if result:
            function_entry["content"] = json.dumps(result)

        self.function_called.append(function_entry)

    def set_pending_function(self, function_call: Dict):
        """Set a function call as pending (requires approval)"""
        self.pending_function_call = function_call

    def clear_pending_function(self):
        """Clear pending function call"""
        self.pending_function_call = None

    def has_pending_function(self) -> bool:
        """Check if there's a pending function call"""
        return self.pending_function_call is not None


class SQLExpertLLM:
    def __init__(self, database_client):
        self.database_client = database_client

        # Configure Gemini API
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # Memory to store last 5 conversations
        self.conversation_memory = deque(maxlen=5)
        self.mode: str = "agent"  # used for system prompt

        # Store the previous context for continue_respond
        self.previous_context: Optional[ExecutionContext] = None

    def execute_function(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute function calls using the actual database"""
        try:
            if name == "execute_sql":
                sql = arguments["text"]
                print(f"[EXECUTE SQL]: {sql}")
                result = self.database_client.execute_sql(sql, multi_statement=True)

                if result.get("success"):
                    return {
                        "success": True,
                        "result": f"Successfully executed: {sql}",
                        "data": result.get("data", [])
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("error", "Unknown error")
                    }

            elif name == "query_sql":
                sql = arguments["text"]
                print(f"[QUERY SQL]: {sql}")
                result = self.database_client.execute_sql(sql)

                if result.get("success"):
                    return {
                        "success": True,
                        "result": f"Query executed: {sql}",
                        "data": result.get("data", [])
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("error", "Unknown error")
                    }

            return {"success": False, "error": f"Function {name} not recognized."}
        except Exception as e:
            return {"success": False, "error": f"Error executing {name}: {str(e)}"}

    def build_messages_with_memory(self, context: ExecutionContext) -> str:
        """
        Build prompt with memory. Includes function-calling context only in 'agent' mode.
        """
        if self.mode == "agent":
            prompt = f"""You are an expert SQL assistant and an AI Agent from ByeDB.AI. You have access to the following database:

You must respond with function calls when the user asks for database operations.

Available functions:
1. execute_sql(text): Execute SQL commands that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
2. query_sql(text): Query the database for information (SELECT statements). Safe and no confirmation needed.

Guidelines:
- Use `execute_sql` for queries that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
- Use `query_sql` for SELECT statements and data inspection
- If the user's request is unclear, ask for clarification
- Always analyze the data before providing insights
- If a function failed, don't keep retrying
- If the user asks to visualise datas, prioritize using markdown table format
- Prefer a single function call with a longer SQL string, than calling functions repeatedly
- Do not repeat the same function and arguments unless necessary

When you need to call a function, respond with a JSON object in this format:
{{
    "function_call": {{
        "name": "function_name",
        "arguments": {{"parameter": "value"}}
    }}
}}

    """
        else:  # ask mode
            prompt = """You are an expert SQL assistant and an AI Agent from ByeDB.AI. Your job is to help write SQL queries and explain database operations.

- Do NOT execute or suggest any function calls.
- Simply write or explain SQL queries based on the user's question.
- Be concise and clear. Return only helpful text or code as needed.

"""

        # Add previous memory if any
        if self.conversation_memory:
            prompt += "Previous conversations:\n"
            for i, conversation in enumerate(self.conversation_memory):
                prompt += f"Conversation {i + 1}:\n"
                for message in conversation:
                    role = message["role"]
                    content = message["content"]
                    prompt += f"{role}: {content}\n"
                prompt += "\n"

        prompt += f"Current question: {context.user_question}\n"

        # Add session context if available
        if context.session_context:
            prompt += f"\nPrevious function results:\n{context.session_context}"

        prompt += "\nResponse:"
        return prompt

    def parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response to extract function calls or direct responses"""
        response_text = response_text.strip()

        # Try to parse as JSON function call
        try:
            if response_text.startswith('{') and 'function_call' in response_text:
                parsed = json.loads(response_text)
                if 'function_call' in parsed:
                    return {
                        "type": "function_call",
                        "function_call": parsed['function_call']
                    }
        except json.JSONDecodeError:
            pass

        # Check if response contains function call markers
        if "function_call" in response_text.lower():
            # Try to extract JSON from the response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end > start:
                try:
                    json_part = response_text[start:end]
                    parsed = json.loads(json_part)
                    if 'function_call' in parsed:
                        return {
                            "type": "function_call",
                            "function_call": parsed['function_call']
                        }
                except json.JSONDecodeError:
                    pass

        # Default to direct response
        return {
            "type": "direct_response",
            "content": response_text
        }

    def generate_response_in_loop(self, context: ExecutionContext, max_depth: int) -> Dict[str, Any]:
        """Generate response with context management"""

        for i in range(max_depth):
            prompt = self.build_messages_with_memory(context)
            print(f"Loop {i + 1}: Generating response...")

            try:
                response = self.model.generate_content(prompt)
            except Exception as e:
                # TODO:
                #  change model and cycle api keys when this happens
                return {
                    "success": False,
                    "response": f"Model not available: {str(e)}",
                    "function_called": context.function_called.copy(),
                    "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
                }
            try:
                response_text = response.text

                parsed_response = self.parse_gemini_response(response_text)
                if parsed_response["type"] == "function_call":
                    fn_call = parsed_response["function_call"]
                    fn_name = fn_call["name"]
                    fn_args = fn_call["arguments"]

                    print(f"Loop {i + 1}: Function call detected: {fn_name}")

                    if fn_name == "execute_sql":
                        context.set_pending_function(fn_call)
                        self.previous_context = context  # Store for continue_respond
                        return {
                            "success": True,
                            "response": "Confirmation Required",
                            "function_called": [{"call": fn_name, "args": fn_args}],
                            "requires_approval": True
                        }

                    # query_sql: execute immediately and return result
                    elif fn_name == "query_sql":
                        function_result = self.execute_function(fn_name, fn_args)
                        context.add_function_call(fn_name, fn_args, function_result)
                        self.previous_context = context  # Store for continue_respond
                        return {
                            "success": True,
                            "response": function_result.get("result", ""),
                            "function_called": [{"call": fn_name, "args": fn_args}],
                            "data": function_result.get("data", []),
                            "usage": {"note": "Gemini API doesn't provide detailed usage stats"},
                            "requires_continue": True
                        }

                    function_result = self.execute_function(fn_name, fn_args)
                    context.add_function_call(fn_name, fn_args, function_result)
                    continue

                # Direct response - we're done
                final_response = parsed_response["content"]
                context.add_assistant_message(final_response)
                self.conversation_memory.append(context.current_conversation.copy())
                return {
                    "success": True,
                    "response": final_response,
                    "function_called": context.function_called.copy(),
                    "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
                }

            except Exception as e:
                print(f"Error in loop {i + 1}: {str(e)}")
                final_response = f"Error occurred: {str(e)}"
                context.add_assistant_message(final_response)
                self.conversation_memory.append(context.current_conversation.copy())
                return {
                    "success": False,
                    "response": final_response,
                    "function_called": context.function_called.copy(),
                    "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
                }

        # If we reach here, it means MAX_LOOPS were hit without a final direct response
        final_response = "Maximum function call iterations reached. Please refine your query or try again."
        context.add_assistant_message(final_response)
        self.conversation_memory.append(context.current_conversation.copy())
        return {
            "success": False,
            "response": final_response,
            "function_called": context.function_called.copy(),
            "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
        }

    def generate_sql_response(self, user_question: str) -> Dict[str, Any]:
        """Generate response with memory and database integration, allowing for multiple function calls."""
        try:
            # Create new context for this conversation
            context = ExecutionContext()
            context.add_user_message(user_question)

            return self.generate_response_in_loop(context, 20)
        except Exception as e:
            return {
                "success": False,
                "error": f"Error generating response: {str(e)}"
            }

    def continue_respond(self) -> Dict[str, Any]:
        """
        Continues the previous conversation, optionally executing any pending function.
        """
        if not self.previous_context:
            return {"success": False, "error": "No previous context to continue."}

        try:
            context = self.previous_context
            self.previous_context = None

            if context.has_pending_function():
                fn_call = context.pending_function_call
                fn_name = fn_call["name"]
                fn_args = fn_call["arguments"]

                print(f"[CONFIRM EXECUTION] {fn_name} with args {fn_args}")

                # Execute the function
                function_result = self.execute_function(fn_name, fn_args)
                context.add_function_call(fn_name, fn_args, function_result)
                context.clear_pending_function()

            # Proceed with next steps regardless of whether a function was executed
            return self.generate_response_in_loop(context, 20)

        except Exception as e:
            return {"success": False, "error": str(e)}

    def clear_memory(self):
        """Clear conversation memory"""
        self.conversation_memory.clear()
        self.previous_context = None

    def get_memory_summary(self) -> List[str]:
        """Get a summary of stored conversations"""
        summaries = []
        for i, conversation in enumerate(self.conversation_memory):
            summaries.append(json.dumps(conversation, indent=2))
        return summaries


# Usage example
if __name__ == '__main__':
    # Import your SupabaseClient
    from db_sqlite import LocalSQLiteDatabase  # Replace with actual import

    # Initialize database client
    db_client = LocalSQLiteDatabase()

    # Initialize agent
    agent = SQLExpertLLM(db_client)

    print(
        "SQL Expert Agent with Memory (type 'quit' to exit, 'memory' to see conversation history, 'clear' to clear memory)")

    while True:
        user_input = input("\nPrompt: ")

        if user_input.lower() == 'quit':
            break
        elif user_input.lower() == 'memory':
            memory_summary = agent.get_memory_summary()
            print("Conversation History:")
            for summary in memory_summary:
                print("=" * 50)
                print(f"{summary}")
            continue
        elif user_input.lower() == 'clear':
            agent.clear_memory()
            print("Memory cleared!")
            continue
        elif user_input.lower() == 'agent':
            agent.mode = 'agent'
            continue
        elif user_input.lower() == 'ask':
            agent.mode = 'ask'
            continue

        response = agent.generate_sql_response(user_input)

        while response.get("requires_approval") or response.get("requires_continue"):
            if response.get("requires_continue"):
                print(response["function_called"][-1]["args"])
                print(response["data"])
                response = agent.continue_respond()
                continue
            print(f"Response: {response['response']}")
            print(f"Functions to execute: {response['function_called']}")

            approval = input("Do you want to proceed? (y/n): ").lower().strip()
            if approval in ['y', 'yes']:
                print("Executing approved function...")
                response = agent.continue_respond()
            else:
                print("Execution cancelled.")
                break
        if response["success"]:
            print(f"\nResponse: {response['response']}")
            print(json.dumps(response, indent=2))
        else:
            print(f"Error: {response}")