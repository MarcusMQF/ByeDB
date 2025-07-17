import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv
from collections import deque

load_dotenv()


class SQLExpertLLM:
    def __init__(self, database_client):
        self.database_client = database_client

        # Configure Gemini API
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # Memory to store last 3 conversations
        self.conversation_memory = deque(maxlen=5)
        self.mode: str = "agent"  # used for system prompt

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

            elif name == "get_schema_info":
                table_name = arguments.get("table_name")

                if table_name:
                    # Get specific table info
                    result = self.database_client.get_table_info(table_name)
                    if result.get("success"):
                        return {
                            "success": True,
                            "result": f"Table info for {table_name}",
                            "data": result.get("data", [])
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Table not found")
                        }
                else:
                    result = self.database_client.list_tables()
                    if result.get("success"):
                        return {
                            "success": True,
                            "result": "All tables in database",
                            "data": result.get("data", [])
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Could not retrieve tables")
                        }

            return {"success": False, "error": f"Function {name} not recognized."}

        except Exception as e:
            return {"success": False, "error": f"Error executing {name}: {str(e)}"}

    def build_messages_with_memory(self, user_question: str) -> str:
        """
        Build prompt with memory. Includes function-calling context only in 'agent' mode.
        """
        if self.mode == "agent":
            prompt = f"""You are an expert SQL assistant. You have access to the following database:

You must respond with function calls when the user asks for database operations.

Available functions:
1. execute_sql(text): Execute SQL commands that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
2. query_sql(text): Query the database for information (SELECT statements). Safe and no confirmation needed.
3. get_schema_info(table_name): Get information about database tables and their structure

Guidelines:
- Use `execute_sql` for queries that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
- Use `query_sql` for SELECT statements and data inspection
- Use `get_schema_info` to get current table structure or list all tables
- If the user's request is unclear, ask for clarification
- Always analyze the data before providing insights
- If a function failed, don't keep retrying

When you need to call a function, respond with a JSON object in this format:
{{
    "function_call": {{
        "name": "function_name",
        "arguments": {{"parameter": "value"}}
    }}
}}

    """
        else:  # ask mode
            prompt = """You are an expert SQL assistant. Your job is to help write SQL queries and explain database operations.

- Do NOT execute or suggest any function calls.
- Simply write or explain SQL queries based on the user's question.
- Be concise and clear. Return only helpful text or code as needed.

"""

        # Add previous memory if any (optional for ask mode too)
        if self.conversation_memory:
            prompt += "Previous conversations:\n"
            for i, conversation in enumerate(self.conversation_memory):
                prompt += f"Conversation {i + 1}:\n"
                for message in conversation:
                    role = message["role"]
                    content = message["content"]
                    prompt += f"{role}: {content}\n"
                prompt += "\n"

        prompt += f"Current question: {user_question}\n\nResponse:"

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

    def generate_response_in_loop(self, user_question: str, max_depth: int) -> Dict[str, Any]:
        current_conversation = []
        current_conversation.append({"role": "user", "content": user_question})

        function_called = []
        context = ""

        for i in range(max_depth):
            prompt = self.build_messages_with_memory(user_question)
            if context:
                prompt += f"\n\nPrevious function results:\n{context}"

            print(f"Loop {i + 1}: Generating response...")

            try:
                response = self.model.generate_content(prompt)
                response_text = response.text

                parsed_response = self.parse_gemini_response(response_text)

                if parsed_response["type"] == "function_call":
                    fn_call = parsed_response["function_call"]
                    fn_name = fn_call["name"]
                    fn_args = fn_call["arguments"]

                    print(f"Loop {i + 1}: Function call detected: {fn_name}")

                    # Execute the function
                    function_result = self.execute_function(fn_name, fn_args)

                    # Add function call and result to context for next iteration
                    context += f"\nFunction call: {fn_name}({fn_args})\n"
                    context += f"Result: {json.dumps(function_result)}\n"

                    function_called.append({
                        "call": f"{fn_name}",
                        "content": json.dumps(function_result)
                    })
                    current_conversation.append({
                        "role": "function",
                        "name": f"{fn_name}",
                        "content": json.dumps(function_result)
                    })
                    continue

                # Direct response - we're done
                final_response = parsed_response["content"]
                current_conversation.append({"role": "assistant", "content": final_response})
                self.conversation_memory.append(current_conversation)
                return {
                    "success": True,
                    "response": final_response,
                    "function_called": function_called,
                    "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
                }

            except Exception as e:
                print(f"Error in loop {i + 1}: {str(e)}")
                final_response = f"Error occurred: {str(e)}"
                current_conversation.append({"role": "assistant", "content": final_response})
                self.conversation_memory.append(current_conversation)
                return {
                    "success": False,
                    "response": final_response,
                    "function_called": function_called,
                    "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
                }

        # If we reach here, it means MAX_LOOPS were hit without a final direct response
        final_response = "Maximum function call iterations reached. Please refine your query or try again."
        current_conversation.append({"role": "assistant", "content": final_response})
        self.conversation_memory.append(current_conversation)
        return {
            "success": False,
            "response": final_response,
            "function_called": function_called,
            "usage": {"note": "Gemini API doesn't provide detailed usage stats"}
        }

    def generate_sql_response(self, user_question: str) -> Dict[str, Any]:
        """Generate response with memory and database integration, allowing for multiple function calls."""
        try:
            return self.generate_response_in_loop(user_question, 10)
        except Exception as e:
            return {
                "success": False,
                "error": f"Error generating response: {str(e)}"
            }

    def clear_memory(self):
        """Clear conversation memory"""
        self.conversation_memory.clear()

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

        if response["success"]:
            print(f"\nResponse: {response['response']}")
            print(json.dumps(response, indent=2))
        else:
            print(f"Error: {response}")