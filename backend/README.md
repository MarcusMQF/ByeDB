# Backend Setup

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the backend directory with:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Azure AI Inference Configuration
AZURE_INFERENCE_ENDPOINT=https://models.github.ai/inference
AZURE_INFERENCE_KEY=your_azure_inference_key_here
MODEL_NAME=deepseek/DeepSeek-R1
```

## Running the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

The server will be available at `https://byedb-ai-cml2.onrender.com`
- API documentation: `https://byedb-ai-cml2.onrender.com/docs`
- Alternative docs: `https://byedb-ai-cml2.onrender.com/redoc` 