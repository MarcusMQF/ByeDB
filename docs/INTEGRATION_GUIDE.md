# ByeDB AI Integration Guide

This guide explains how the AI integration works in ByeDB and how to set it up.

## Overview

The ByeDB application now integrates with an AI language model to provide intelligent SQL responses. The integration includes:

- **Backend API**: FastAPI endpoint that processes SQL questions using GitHub Models API
- **Frontend Chat**: Updated chat interface with markdown formatting for AI responses
- **Response Formatting**: Support for bold text (`**text**`) and code blocks (```sql) with copy functionality

## Architecture

```
Frontend (Next.js) → Backend API (FastAPI) → GitHub Models API (GPT-4)
     ↓                      ↓                        ↓
Chat Interface → /api/sql-question → SQL Expert LLM → Formatted Response
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```env
   GITHUB_TOKEN=your_github_token_here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Testing the Integration

1. Run the integration test:
   ```bash
   cd backend
   python test_integration.py
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Try asking SQL questions in the chat interface

## API Endpoints

### POST /api/sql-question

Process a natural language SQL question and return an expert response.

**Request Body:**
```json
{
  "question": "How do I create a users table?",
  "context": "Optional context about uploaded files or previous conversation"
}
```

**Response:**
```json
{
  "success": true,
  "response": "To create a users table, you can use the following SQL...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "ByeDB API"
}
```

## Features

### 1. AI-Powered SQL Responses

The system uses GitHub Models API (GPT-4) to provide intelligent SQL responses with:
- Context-aware prompting based on user intent
- Educational explanations for learning
- Production-ready code for implementation
- Troubleshooting help for existing queries
- Performance optimization suggestions
- Database design guidance

### 2. Response Formatting

The frontend supports rich markdown formatting:

- **Bold text**: `**text**` renders as **text**
- **Code blocks**: 
  ```sql
  SELECT * FROM users;
  ```
- **Inline code**: `SELECT` renders as `SELECT`
- **Copy functionality**: Click the copy button on code blocks

### 3. Error Handling

The system includes comprehensive error handling:
- Connection errors to the backend
- API errors from the language model
- Validation errors for empty questions
- Graceful fallbacks for network issues

## File Structure

```
backend/
├── main.py              # FastAPI application with API endpoints
├── llm.py               # SQL Expert LLM class
├── db.py                # Database utilities (optional)
├── test_integration.py  # Integration test script
├── env.example          # Environment variables example
└── requirements.txt     # Python dependencies

frontend/
├── components/
│   ├── chat.tsx                # Main chat interface
│   ├── chat-message.tsx        # Message display component
│   └── markdown-response.tsx   # AI response formatting
└── app/
    └── dashboard/
        └── page.tsx            # Dashboard page
```

## Troubleshooting

### Common Issues

1. **"Connection error" in test script**
   - Make sure the backend server is running on port 8000
   - Check that no firewall is blocking the connection

2. **"GITHUB_TOKEN environment variable is not set"**
   - Create a `.env` file in the backend directory
   - Add your GitHub token (get one from GitHub Settings > Developer settings > Personal access tokens)

3. **"Failed to copy text" in frontend**
   - This is usually due to browser security restrictions
   - Make sure you're using HTTPS or localhost

4. **Frontend not connecting to backend**
   - Check that the backend is running on `http://localhost:8000`
   - Verify CORS settings in `main.py`

### Testing Individual Components

1. **Test the LLM directly:**
   ```bash
   cd backend
   python llm.py quick
   ```

2. **Test the API endpoint:**
   ```bash
   cd backend
   python test_integration.py
   ```

3. **Test the frontend formatting:**
   - Open the chat interface
   - Send a test message
   - Check that markdown formatting works

## Performance Considerations

- The AI responses are cached for 1 hour by default
- Code blocks are syntax-highlighted for better readability
- The system uses streaming for long responses (future enhancement)
- Error boundaries prevent crashes from malformed responses

## Security Notes

- The backend validates all input before sending to the AI
- No sensitive data is logged
- The GitHub token is kept secure in environment variables
- CORS is configured to allow only necessary origins

## Future Enhancements

- [ ] Response streaming for real-time updates
- [ ] Conversation history and context
- [ ] SQL query execution (read-only)
- [ ] Database schema integration
- [ ] Advanced syntax highlighting
- [ ] Response caching and optimization 