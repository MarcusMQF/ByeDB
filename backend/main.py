from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import SupabaseClient
from llm import client, system_prompt

app = FastAPI(title="ByeDB API", description="Natural Language to SQL API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class QueryRequest(BaseModel):
    query: str
    table_context: Optional[str] = None

class QueryResponse(BaseModel):
    success: bool
    sql_query: Optional[str] = None
    explanation: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class TableCreateRequest(BaseModel):
    table_name: str
    columns: Dict[str, str]

class DataRequest(BaseModel):
    table_name: str
    data: Dict[str, Any]
    filters: Optional[Dict[str, Any]] = None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)