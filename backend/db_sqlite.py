import io
import os
import tempfile

import aiosqlite
import asyncio
import sqlparse
import pandas as pd
from typing import Dict, Any, List, Optional


class LocalSQLiteDatabase:
    def __init__(self, db_path: str = ':memory:'):
        self.db_path = db_path
        self.conn: Optional[aiosqlite.Connection] = None

    async def connect(self):
        self.conn = await aiosqlite.connect(self.db_path)
        self.conn.row_factory = aiosqlite.Row
        print(f"Connected to SQLite database: {self.db_path}")

    async def close(self):
        if self.conn:
            await self.conn.close()
            print(f"Disconnected from SQLite database: {self.db_path}")

    async def execute_sql(self, sql_query: str) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            statements = sqlparse.split(sql_query)
            results = []

            async with self.conn.execute("BEGIN"):
                for statement in statements:
                    statement = statement.strip()
                    if not statement:
                        continue

                    upper_stmt = statement.upper()
                    async with self.conn.execute(statement) as cursor:
                        if upper_stmt.startswith("SELECT"):
                            rows = await cursor.fetchall()
                            data = [dict(row) for row in rows]
                            results.append({
                                "statement": statement,
                                "type": "SELECT",
                                "data": data
                            })
                        else:
                            results.append({
                                "statement": statement,
                                "type": "NON-SELECT",
                                "message": "Executed successfully."
                            })
                await self.conn.commit()

            data = [row for r in results if r["type"] == "SELECT" for row in r["data"]]
            return {"success": True, "message": "Executed multiple statements.", "data": data, "results": results}

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def list_tables(self) -> Dict[str, Any]:
        sql = "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence';"
        return await self.execute_sql(sql)

    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        return await self.execute_sql(f"PRAGMA table_info('{table_name}')")

    async def clear_database(self) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            tables_result = await self.list_tables()
            if not tables_result["success"]:
                return {"success": False, "error": "Failed to retrieve table list."}

            tables = [row["name"] for row in tables_result.get("data", [])]
            dropped_tables = []
            errors = []

            for table in tables:
                try:
                    await self.conn.execute(f"DROP TABLE IF EXISTS {table};")
                    dropped_tables.append(table)
                except Exception as e:
                    errors.append({"table": table, "error": str(e)})

            await self.conn.commit()

            return {
                "success": not errors,
                "message": f"Cleared tables: {len(dropped_tables)}",
                "dropped_tables": dropped_tables,
                "errors": errors
            }

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def export_all_data(self) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            tables_result = await self.list_tables()
            if not tables_result["success"]:
                return {"success": False, "error": "Failed to retrieve table list."}

            tables = [row["name"] for row in tables_result.get("data", [])]
            export_data = {}

            for table in tables:
                result = await self.execute_sql(f"SELECT * FROM {table};")
                if result["success"]:
                    export_data[table] = result["data"]
                else:
                    export_data[table] = {"error": result.get("error", "Failed to fetch data.")}

            return {"success": True, "data": export_data, "table_count": len(export_data)}

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def load_all_data(self, data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        errors = []
        loaded_tables = []

        try:
            for table, rows in data.items():
                if not isinstance(rows, list) or not rows:
                    errors.append({"table": table, "error": "Invalid or empty row data."})
                    continue

                columns = list(rows[0].keys())

                placeholders = ", ".join(["?" for _ in columns])
                insert_query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"

                for row in rows:
                    values = [row.get(col) for col in columns]
                    await self.conn.execute(insert_query, values)

                loaded_tables.append(table)

            await self.conn.commit()

            return {
                "success": not errors,
                "loaded_tables": loaded_tables,
                "errors": errors
            }

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def load_dataframe(self, df: pd.DataFrame, table_name: str) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            await self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
            columns = ", ".join([f'"{col}" TEXT' for col in df.columns])
            await self.conn.execute(f"CREATE TABLE {table_name} ({columns})")

            insert_query = f"INSERT INTO {table_name} ({', '.join(df.columns)}) VALUES ({', '.join(['?' for _ in df.columns])})"
            for _, row in df.iterrows():
                await self.conn.execute(insert_query, tuple(row.astype(str)))

            await self.conn.commit()
            return {"success": True, "table": table_name}

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def import_from_sql_file(self, file_path: str) -> Dict[str, Any]:
        """Imports SQL commands from a .sql file and executes them."""
        if not self.conn:
            return {"success": False, "error": "Database not connected."}
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                sql_script = f.read()

            await self.conn.executescript(sql_script)
            await self.conn.commit()
            return {"success": True, "message": f"Executed SQL from file '{file_path}'."}

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def import_from_db_file(self, file_path: str) -> Dict[str, Any]:
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            file_conn = await aiosqlite.connect(file_path)
            file_conn.row_factory = aiosqlite.Row

            tables_result = await file_conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence';"
            )
            tables = [row["name"] async for row in tables_result]

            for table in tables:
                data_cursor = await file_conn.execute(f"SELECT * FROM {table};")
                rows = await data_cursor.fetchall()
                columns = [col[0] for col in data_cursor.description]

                await self.conn.execute(f"DROP TABLE IF EXISTS {table}")
                col_defs = ", ".join([f'"{col}" TEXT' for col in columns])
                await self.conn.execute(f"CREATE TABLE {table} ({col_defs})")

                insert_query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(['?' for _ in columns])})"
                for row in rows:
                    await self.conn.execute(insert_query, tuple(str(row[col]) for col in columns))

            await file_conn.close()
            await self.conn.commit()

            return {"success": True, "message": f"Imported tables: {tables}"}

        except Exception as e:
            await self.conn.rollback()
            return {"success": False, "error": str(e)}

    async def export_as_sql(self) -> str:
        if not self.conn:
            raise ValueError("Database not connected.")
        buffer = io.StringIO()
        async for line in self.conn.iterdump():
            buffer.write(f"{line}\n")
        return buffer.getvalue()

    async def export_to_db_binary(self) -> [io.BytesIO, None]:
        if not self.conn:
            return io.BytesIO()

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".sqlite") as tmp:
                tmp_path = tmp.name

            dest_conn = await aiosqlite.connect(tmp_path)
            await self.conn.backup(dest_conn)
            await dest_conn.close()

            async with open(tmp_path, "rb") as f:
                buffer = io.BytesIO(await f.read())

            return buffer

        except Exception as e:
            print(f"Error: export_to_db_binary: {e}")
            return None

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    async def get_table_names(self) -> List[str]:
        result = await self.list_tables()
        if result["success"]:
            return [row["name"] for row in result["data"]]
        return []

    def get_db_path(self) -> str:
        return self.db_path


if __name__ == '__main__':
    import asyncio
    import tempfile
    import os

    async def main():
        print("📦 Initializing original DB...")
        db = LocalSQLiteDatabase()
        await db.connect()

        print("🧱 Creating and populating test table...")
        await db.execute_sql("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT
            );
            INSERT INTO users (name) VALUES ('Alice'), ('Bob');
        """)

        print("📄 Exporting SQL dump...")
        sql_dump = await db.export_as_sql()
        print("--- SQL DUMP ---\n", sql_dump)

        # Save SQL to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".sql", mode="w", encoding="utf-8") as sql_file:
            sql_file.write(sql_dump)
            sql_path = sql_file.name

        print(f"✅ SQL written to: {sql_path}")

        print("💾 Exporting binary .sqlite database...")
        db_binary = await db.export_to_db_binary()
        binary_path = None

        if db_binary:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".sqlite") as bin_file:
                bin_file.write(db_binary.read())
                binary_path = bin_file.name
            print(f"✅ Binary DB written to: {binary_path}")
        else:
            print("❌ Failed to export binary DB.")

        print("🧪 Testing import from SQL file into new DB instance...")
        new_db_sql = LocalSQLiteDatabase()
        await new_db_sql.connect()
        result = await new_db_sql.import_from_sql_file(sql_path)
        print("📥 SQL import result:", result)
        print("🧾 Imported data (SQL):", await new_db_sql.execute_sql("SELECT * FROM users"))
        await new_db_sql.close()

        print("🧪 Testing import from binary DB file into another new instance...")
        new_db_bin = LocalSQLiteDatabase()
        await new_db_bin.connect()
        result = await new_db_bin.import_from_db_file(binary_path)
        print("📥 Binary import result:", result)
        print("🧾 Imported data (Binary):", await new_db_bin.execute_sql("SELECT * FROM users"))
        await new_db_bin.close()

        print("🧹 Cleaning up temp files...")
        if os.path.exists(sql_path):
            os.remove(sql_path)
        if binary_path and os.path.exists(binary_path):
            os.remove(binary_path)

        await db.close()
        print("✅ All tests complete!")

    asyncio.run(main())

