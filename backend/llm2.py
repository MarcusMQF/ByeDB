
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
# Environment variables
token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.github.ai/inference"
model = "openai/gpt-4.1"

# Create OpenAI-compatible client
client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

# Define available functions (for function calling)
functions = [
    {
        "name": "respond",
        "description": "Provide a natural language response or query to the user.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Natural language response."
                }
            },
            "required": ["text"]
        }
    },
    {
        "name": "execute_sql",
        "description": "Convert the user query to a SQL statement.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "A SQL query string that represents the user's request."
                }
            },
            "required": ["text"]
        }
    }
]

# Send chat + functions
response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "system",
            "content": (
                "You are a SQL-generating assistant for a database system.\n\n"
                "- If the user's request is clear and actionable as a SQL operation, use the `execute_sql` function.\n"
                "- If there is any ambiguity (e.g., missing table name, unclear columns, vague intent), do not guess.\n"
                "- Instead, use the `respond` function to ask the user a precise clarifying question.\n"
                "- Never assume database schema — always seek clarity if something is not explicitly stated.\n\n"
                "Your job is to either:\n"
                "1. Convert the request to a valid SQL query (using `execute_sql`), OR\n"
                "2. Ask a clear, specific question back to the user (using `respond`) to remove ambiguity.\n"
            )
        },
        {
            "role": "user",
            "content": input("Prompt: ")
        }
    ],
    functions=functions,
    function_call="auto",  # Let GPT decide which function to call
    temperature=0,
    top_p=1.0,
)

# Parse function call result
choice = response.choices[0]

if choice.finish_reason == "function_call":
    fn = choice.message.function_call
    print(f"Function to call: {fn.name}")
    print(f"Arguments: {fn.arguments}")
else:
    print("Response:", choice.message.content)
