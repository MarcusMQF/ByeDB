import os
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from collections import deque

load_dotenv()


class SQLExpertLLM:
    def __init__(self, supabase_client):
        self.supabase_client = supabase_client
        self.client = OpenAI(
            base_url=os.getenv("OPENAI_BASE_URL", "https://models.github.ai/inference"),
            api_key=os.environ["GITHUB_TOKEN"]
        )
        self.model = "openai/gpt-4.1"

        # Memory to store last 3 conversations
        self.conversation_memory = deque(maxlen=3)

        self.functions = [
            {
                "name": "execute_sql",
                "description": "Execute SQL commands that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "A SQL query string that modifies the database."
                        }
                    },
                    "required": ["text"]
                }
            },
            {
                "name": "query_sql",
                "description": "Query the database for information (SELECT statements). Safe and no confirmation needed.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "A SQL query to inspect or retrieve data from the database."
                        }
                    },
                    "required": ["text"]
                }
            },
            {
                "name": "get_schema_info",
                "description": "Get information about database tables and their structure",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "table_name": {
                            "type": "string",
                            "description": "Optional table name to get specific table info. If not provided, lists all tables."
                        }
                    },
                    "required": []
                }
            }
        ]

    def execute_function(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute function calls using the actual database"""
        try:
            if name == "execute_sql":
                sql = arguments["text"]
                print(f"[EXECUTE SQL]: {sql}")
                result = self.supabase_client.execute_query(sql)

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
                result = self.supabase_client.execute_query(sql)

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
                    result = self.supabase_client.get_table_info(table_name)
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
                    result = self.supabase_client.list_tables()
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

    def build_messages_with_memory(self, user_question: str) -> List[Dict[str, Any]]:
        """Build messages including conversation memory"""
        messages = []

        # Add system message with dynamic schema
        messages.append({
            "role": "system",
            "content": f"""You are an expert SQL assistant. You have access to the following database:

You must always respond using function calls when the user asks for database operations.

Guidelines:
- Use `execute_sql` for queries that modify the database (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
- Use `query_sql` for SELECT statements and data inspection
- Use `get_schema_info` to get current table structure or list all tables
- If the user's request is unclear, ask for clarification
- Always analyze the data before providing insights
- Remember previous conversations in this session
"""
        })

        # Add previous conversations from memory
        for conversation in self.conversation_memory:
            messages.extend(conversation)

        # Add current user question
        messages.append({
            "role": "user",
            "content": user_question
        })

        return messages

    def generate_sql_response(self, user_question: str) -> Dict[str, Any]:
        """Generate response with memory and database integration"""
        current_conversation = []

        # Build messages with memory
        messages = self.build_messages_with_memory(user_question)
        current_conversation.append({"role": "user", "content": user_question})

        try:
            # Get initial response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                functions=self.functions,
                function_call="auto",
                temperature=0
            )

            choice = response.choices[0]
            message = choice.message

            # Handle function calls
            if choice.finish_reason == "function_call":
                fn_call = message.function_call
                fn_name = fn_call.name
                fn_args = json.loads(fn_call.arguments)

                # Execute the function
                result = self.execute_function(fn_name, fn_args)

                # Add function call and result to messages
                messages.append({
                    "role": "assistant",
                    "function_call": fn_call
                })
                messages.append({
                    "role": "function",
                    "name": fn_name,
                    "content": json.dumps(result)
                })

                # Get follow-up response
                followup_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0
                )

                followup_message = followup_response.choices[0].message
                final_response = followup_message.content

                # Add to current conversation
                current_conversation.append({
                    "role": "assistant",
                    "content": final_response
                })

                # Store in memory
                self.conversation_memory.append(current_conversation)

                return {
                    "success": True,
                    "response": final_response,
                    "function_called": fn_name,
                    "function_result": result,
                    "usage": {
                        "prompt_tokens": followup_response.usage.prompt_tokens if followup_response.usage else 0,
                        "completion_tokens": followup_response.usage.completion_tokens if followup_response.usage else 0,
                        "total_tokens": followup_response.usage.total_tokens if followup_response.usage else 0
                    }
                }

            # No function call - direct response
            final_response = message.content
            current_conversation.append({
                "role": "assistant",
                "content": final_response
            })

            # Store in memory
            self.conversation_memory.append(current_conversation)

            return {
                "success": True,
                "response": final_response,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0
                }
            }

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
            user_msg = next((msg["content"] for msg in conversation if msg["role"] == "user"), "Unknown")
            summaries.append(f"Conversation {i + 1}: {user_msg[:50]}...")
        return summaries


# Usage example
if __name__ == '__main__':
    # Import your SupabaseClient
    from db import SupabaseClient  # Replace with actual import

    # Initialize database client
    db_client = SupabaseClient.get_instance()

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
                print(f"  - {summary}")
            continue
        elif user_input.lower() == 'clear':
            agent.clear_memory()
            print("Memory cleared!")
            continue

        response = agent.generate_sql_response(user_input)

        if response["success"]:
            print(f"\nResponse: {response['response']}")
            print(json.dumps(response, indent=2))
        else:
            print(f"Error: {response['error']}")