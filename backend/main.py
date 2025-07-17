import csv
import json
from typing import Optional

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
        if request.mode is not None:
            sql_expert.mode = request.mode
        result = sql_expert.generate_sql_response(request.question)

        if result["success"]:
            return SQLQuestionResponse(
                success=True,
                meta=result,
                response=result["response"]
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
            meta={},
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
        contents = await file.read()
        data = json.loads(contents.decode("utf-8"))

        load_result = database.load_all_data(data, truncate=truncate)
        if not load_result["success"]:
            raise HTTPException(status_code=400, detail=load_result["errors"])

        return {
            "success": True,
            "message": "Database data loaded successfully.",
            "loaded_tables": load_result["loaded_tables"]
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-csv")
async def upload_csv(files: list[UploadFile] = File(...), truncate: bool = True):
    try:
        loaded_tables = []
        for file in files:
            filename = file.filename or "table"
            table_name = filename.rsplit(".", 1)[0]  # remove extension
            content = await file.read()
            decoded = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)

            if not rows:
                continue

            # Create table if it doesn't exist
            columns = rows[0].keys()
            create_table_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join([f'{col} TEXT' for col in columns])});"
            database.execute_sql(create_table_sql)

            if truncate:
                database.execute_sql(f"DELETE FROM {table_name}")

            # Insert rows
            for row in rows:
                placeholders = ", ".join(["?"] * len(columns))
                insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                database.execute_sql(insert_sql, tuple(row.values()))

            loaded_tables.append(table_name)

        return {"success": True, "loaded_tables": loaded_tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi.responses import StreamingResponse
import zipfile
import io


@app.get("/api/export-csv")
async def export_csv():
    try:
        tables_result = database.list_tables()
        if not tables_result["success"]:
            raise HTTPException(status_code=500, detail=tables_result["error"])

        table_names = [row["name"] for row in tables_result["data"]]

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
            for table in table_names:
                query_result = database.execute_sql(f"SELECT * FROM {table}")
                if not query_result["success"]:
                    continue

                output = io.StringIO()
                writer = csv.DictWriter(output,
                                        fieldnames=query_result["data"][0].keys() if query_result["data"] else [])
                writer.writeheader()
                writer.writerows(query_result["data"])
                zipf.writestr(f"{table}.csv", output.getvalue())

        zip_buffer.seek(0)
        return StreamingResponse(zip_buffer, media_type="application/x-zip-compressed", headers={
            "Content-Disposition": "attachment; filename=exported_tables.zip"
        })
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
            return SQLQuestionResponse(success=False, meta={}, error="Execution not approved.")

        # Since continue_respond doesn't exist, use generate_sql_response with a continuation message
        result = sql_expert.generate_sql_response("Please continue with the previous operation.")
        if result["success"]:
            return SQLQuestionResponse(
                success=True,
                meta=result,
                response=result["response"]
            )
        else:
            return SQLQuestionResponse(success=False, meta=result, error=result["error"])

    except Exception as e:
        return SQLQuestionResponse(success=False, meta={}, error=str(e))


@app.get("/")
async def root():
    return {"message": "ByeDB API is running", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ByeDB API"}
