import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.github.ai/inference"
model = "openai/gpt-4.1"

client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

system_prompt = """You are an expert in Supabase and PostgreSQL queries. Your task is to convert natural language requests into precise Supabase JavaScript client queries or direct SQL when needed.

Guidelines:
1. For simple queries, use the Supabase JavaScript client syntax
2. For complex queries that need joins or advanced features, use SQL with rpc()
3. Always include the table name in the query
4. Make reasonable assumptions about schema if not specified
5. Return only the code, with a brief comment explaining the query
6. Use proper Supabase methods like .select(), .eq(), .insert(), etc.
7. For authentication-related queries, use the auth methods

Example conversions:
User: "Get all users"
Response: // Fetch all user records
const { data, error } = await supabase
  .from('users')
  .select('*')

User: "Find products priced over $50"
Response: // Find products with price > 50
const { data, error } = await supabase
  .from('products')
  .select('*')
  .gt('price', 50)"""

response = client.chat.completions.create(
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Get me the names and emails of customers who made purchases in the last 30 days"}
    ],
    temperature=0.3,  # Lower temperature for more deterministic queries
    top_p=0.9,
    model=model
)

# print(response.choices[0].message.content)