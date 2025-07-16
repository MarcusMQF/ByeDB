import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Configuration
endpoint = os.getenv("AZURE_INFERENCE_ENDPOINT", "https://models.github.ai/inference")
model_name = os.getenv("MODEL_NAME", "deepseek/DeepSeek-R1")
token = os.getenv("AZURE_INFERENCE_KEY")

if not token:
    raise ValueError("AZURE_INFERENCE_KEY must be set in environment variables")

# Initialize client
client = ChatCompletionsClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(token),
)

def response(prompt):
    try:
        response = client.complete(
            messages=[UserMessage(content=prompt)],
            max_tokens=1000,
            model=model_name,
            temperature=0.3
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return None