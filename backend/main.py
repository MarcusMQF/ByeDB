from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from llm import SQLExpertLLM

app = FastAPI(title="ByeDB API", description="Natural Language to SQL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the SQL Expert LLM
sql_expert = SQLExpertLLM()

class SQLQuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None

class SQLQuestionResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    usage: Optional[dict] = None

@app.post("/api/sql-question", response_model=SQLQuestionResponse)
async def ask_sql_question(request: SQLQuestionRequest):
    """
    Process a natural language SQL question and return an expert response
    """
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Generate SQL response using the LLM
        result = sql_expert.generate_sql_response(
            user_question=request.question,
            context=request.context
        )
        
        if result["success"]:
            return SQLQuestionResponse(
                success=True,
                response=result["response"],
                usage=result.get("usage")
            )
        else:
            return SQLQuestionResponse(
                success=False,
                error=result["error"]
            )
            
    except Exception as e:
        return SQLQuestionResponse(
            success=False,
            error=str(e)
        )

@app.get("/")
async def root():
    return {"message": "ByeDB API is running", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ByeDB API"}

