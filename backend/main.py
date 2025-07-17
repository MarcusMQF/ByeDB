import json
from typing import Optional

import pandas as pd
import io
import os

from fastapi import FastAPI, HTTPException
from fastapi import UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db_sqlite import LocalSQLiteDatabase
from llm_gemini import SQLExpertLLM

app = FastAPI(title="ByeDB API", description="Natural Language to SQL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the SQL Expert LLM
contexts = {
    "user_id": []
}

database = LocalSQLiteDatabase()
sql_expert = SQLExpertLLM(database)


class SQLQuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None
    mode: Optional[str] = "agent"  # Default is 'agent'; alternative is 'ask'


class SQLQuestionResponse(BaseModel):
    success: bool
    meta: dict
    response: Optional[str] = None
    error: Optional[str] = None


@app.post("/api/sql-question", response_model=SQLQuestionResponse)
async def ask_sql_question(request: SQLQuestionRequest):
    """
    Process a natural language SQL question and return an expert response
    """
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        # Generate SQL response using the LLM
        sql_expert.mode = request.mode
        result = sql_expert.generate_sql_response(request.question)

        if result["success"]:
            return SQLQuestionResponse(
                success=True,
                meta=result,
                response=result["response"],
                usage=result.get("usage")
            )
        else:
            return SQLQuestionResponse(
                success=False,
                meta=result,
                error=result["error"]
            )

    except Exception as e:
        return SQLQuestionResponse(
            success=False,
            error=str(e)
        )


@app.get("/api/export-db")
async def export_database():
    try:
        export_result = database.export_all_data()
        if not export_result["success"]:
            raise HTTPException(status_code=500, detail=export_result["error"])
        return {"success": True, "data": export_result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/upload-db")
async def upload_database(file: UploadFile = File(...), truncate: bool = Form(True)):
    try:
        filename = file.filename.lower()
        contents = await file.read()

        if filename.endswith(".json"):
            # Load JSON content into tables
            data = json.loads(contents.decode("utf-8"))
            load_result = database.load_all_data(data, truncate=truncate)

        elif filename.endswith(".csv"):
            # Load single CSV as one table
            df = pd.read_csv(io.BytesIO(contents))
            table_name = os.path.splitext(file.filename)[0]
            load_result = database.load_dataframe(df, table_name=table_name, truncate=truncate)

        elif filename.endswith((".xlsx", ".xls")):
            # Load each sheet as one table
            excel_data = pd.read_excel(io.BytesIO(contents), sheet_name=None)
            results = []
            for sheet_name, df in excel_data.items():
                result = database.load_dataframe(df, table_name=sheet_name, truncate=truncate)
                results.append(result)

            load_result = {
                "success": all(r["success"] for r in results),
                "loaded_tables": [r["table"] for r in results if r["success"]],
                "errors": [r for r in results if not r["success"]],
            }

        elif filename.endswith(".db"):
            # Import all tables from another SQLite .db file
            db_path = f"/tmp/{file.filename}"
            with open(db_path, "wb") as f:
                f.write(contents)

            database.import_from_sqlite_file(db_path)

            load_result = {
                "success": True,
                "loaded_tables": database.get_table_names()
            }

        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")

        if not load_result["success"]:
            raise HTTPException(status_code=400, detail=load_result.get("errors", "Failed to load data."))

        return {
            "success": True,
            "message": "Database data loaded successfully.",
            "loaded_tables": load_result["loaded_tables"]
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ContinueRequest(BaseModel):
    approve: bool  # Whether to proceed with execution
    context: Optional[str] = None  # Optional conversation context (e.g., user confirmation notes)


@app.post("/api/confirm-execution", response_model=SQLQuestionResponse)
async def confirm_execution(request: ContinueRequest):
    """
    Confirms whether to proceed with the last generated SQL query and executes it if approved.
    """
    try:
        if not request.approve:
            return SQLQuestionResponse(success=False, error="Execution not approved.")

        result = sql_expert.continue_respond()
        if result["success"]:
            return SQLQuestionResponse(
                success=True,
                response=result["response"],
                usage=result.get("usage")
            )
        else:
            return SQLQuestionResponse(success=False, error=result["error"])

    except Exception as e:
        return SQLQuestionResponse(success=False, error=str(e))


@app.get("/")
async def root():
    return {"message": "ByeDB API is running", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ByeDB API"}


@app.post("/api/clear-memory")
async def clear_memory():
    try:
        sql_expert.clear_memory()
        return {"success": True, "message": "Memory cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
