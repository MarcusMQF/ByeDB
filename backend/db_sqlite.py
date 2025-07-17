import sqlite3
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd

class LocalSQLiteDatabase:
    """
    A local SQLite database client with methods for common operations
    and a generic execute_sql function that supports multiple statements.
    """

    def __init__(self, db_path: str = ':memory:'):
        """
        Initializes the SQLite database connection.

        Args:
            db_path (str, optional): Path to the SQLite database file.
                                     Defaults to ':memory:' for an in-memory database.
        """
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None
        self._connect()

    def _connect(self):
        """Establishes a connection to the SQLite database."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row  # Allows accessing columns by name
            self.cursor = self.conn.cursor()
            print(f"Connected to SQLite database: {self.db_path}")
        except sqlite3.Error as e:
            print(f"Error connecting to database: {e}")
            self.conn = None
            self.cursor = None

    def close(self):
        """Closes the database connection."""
        if self.conn:
            self.conn.close()
            print(f"Disconnected from SQLite database: {self.db_path}")
            self.conn = None
            self.cursor = None

    def execute_sql(self, sql_query: str, params: Tuple = (), multi_statement: bool = False) -> Dict[str, Any]:
        """
        Executes an arbitrary SQL query or multiple SQL statements.

        Args:
            sql_query (str): The SQL query string to execute.
            params (Tuple): Parameters to bind to the SQL query (for parameterized queries).
                           Note: Parameters are not supported with multi_statement=True.
            multi_statement (bool): If True, allows executing multiple SQL statements.
                                  If False, executes only a single statement.

        Returns:
            Dict[str, Any]: A dictionary indicating success/failure, a message, and data (if any).
        """
        if not self.conn or not self.cursor:
            return {"success": False, "error": "Database not connected."}

        try:
            if multi_statement:
                # Use executescript for multiple statements
                if params:
                    return {"success": False,
                            "error": "Parameters are not supported with multi_statement=True. Use single statements with parameters instead."}

                # executescript() doesn't return results, so we can't get SELECT data
                self.cursor.executescript(sql_query)
                self.conn.commit()
                return {"success": True, "message": "Multi-statement script executed successfully.", "data": []}
            else:
                # Single statement execution
                self.cursor.execute(sql_query, params)
                # Check if the query was a SELECT statement
                if sql_query.strip().upper().startswith("SELECT"):
                    rows = self.cursor.fetchall()
                    # Convert rows to list of dictionaries for easier handling
                    data = [dict(row) for row in rows]
                    return {"success": True, "message": "Query executed successfully.", "data": data}
                else:
                    self.conn.commit()  # Commit changes for non-SELECT queries
                    return {"success": True, "message": "Command executed successfully.", "data": []}
        except sqlite3.Error as e:
            self.conn.rollback()  # Rollback in case of error
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"An unexpected error occurred: {e}"}

    def execute_script(self, script: str) -> Dict[str, Any]:
        """
        Executes multiple SQL statements as a script.
        This is a convenience method that calls execute_sql with multi_statement=True.

        Args:
            script (str): The SQL script containing multiple statements.

        Returns:
            Dict[str, Any]: A dictionary indicating success/failure and a message.
        """
        return self.execute_sql(script, multi_statement=True)

    def execute_statements(self, statements: List[str]) -> Dict[str, Any]:
        """
        Executes multiple SQL statements one by one, allowing for individual error handling.

        Args:
            statements (List[str]): List of SQL statements to execute.

        Returns:
            Dict[str, Any]: A dictionary with success status, results for each statement, and any errors.
        """
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        results = []
        errors = []

        for i, statement in enumerate(statements):
            statement = statement.strip()
            if not statement:
                continue

            try:
                result = self.execute_sql(statement)
                results.append({
                    "statement_index": i,
                    "statement": statement,
                    "result": result
                })

                if not result["success"]:
                    errors.append({
                        "statement_index": i,
                        "statement": statement,
                        "error": result.get("error", "Unknown error")
                    })
            except Exception as e:
                error_info = {
                    "statement_index": i,
                    "statement": statement,
                    "error": str(e)
                }
                errors.append(error_info)
                results.append({
                    "statement_index": i,
                    "statement": statement,
                    "result": {"success": False, "error": str(e)}
                })

        return {
            "success": len(errors) == 0,
            "message": f"Executed {len(statements)} statements with {len(errors)} errors.",
            "results": results,
            "errors": errors
        }

    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """
        Retrieves schema information for a specific table.

        Args:
            table_name (str): The name of the table.

        Returns:
            Dict[str, Any]: A dictionary with success status and table schema data.
        """
        sql = f"PRAGMA table_info('{table_name}')"
        return self.execute_sql(sql)

    def list_tables(self) -> Dict[str, Any]:
        """
        Lists all tables in the database.

        Returns:
            Dict[str, Any]: A dictionary with success status and a list of table names.
        """
        sql = "SELECT name FROM sqlite_master WHERE type='table';"
        return self.execute_sql(sql)

    def export_all_data(self) -> Dict[str, Any]:
        """
        Exports all tables and their data from the database.

        Returns:
            Dict[str, Any]: A dictionary with success status and exported data.
        """
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            tables_result = self.list_tables()
            if not tables_result["success"]:
                return {"success": False, "error": "Failed to retrieve table list."}

            tables = [row["name"] for row in tables_result.get("data", [])]
            export_data = {}

            for table in tables:
                query = f"SELECT * FROM {table};"
                result = self.execute_sql(query)
                if result["success"]:
                    export_data[table] = result["data"]
                else:
                    export_data[table] = {"error": result.get("error", "Failed to fetch data.")}

            return {"success": True, "data": export_data, "table_count": len(export_data)}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def load_all_data(self, data: Dict[str, List[Dict[str, Any]]], truncate: bool = True) -> Dict[str, Any]:
        """
        Loads data into the database from a dictionary of tables and rows.

        Args:
            data (Dict[str, List[Dict[str, Any]]]): The data to load, structured as {table_name: [row_dicts]}.
            truncate (bool): If True, clears existing data in the tables before loading.

        Returns:
            Dict[str, Any]: A dictionary with success status, loaded table names, and any errors.
        """
        if not self.conn or not self.cursor:
            return {"success": False, "error": "Database not connected."}

        errors = []
        loaded_tables = []

        for table, rows in data.items():
            if not isinstance(rows, list) or not rows:
                errors.append({"table": table, "error": "No rows provided or invalid format."})
                continue

            # Use first row to infer columns
            columns = list(rows[0].keys())

            try:
                if truncate:
                    self.cursor.execute(f"DELETE FROM {table};")

                placeholders = ", ".join(["?" for _ in columns])
                column_names = ", ".join(columns)
                insert_query = f"INSERT INTO {table} ({column_names}) VALUES ({placeholders})"

                for row in rows:
                    values = [row.get(col) for col in columns]
                    self.cursor.execute(insert_query, values)

                loaded_tables.append(table)

            except sqlite3.Error as e:
                errors.append({"table": table, "error": str(e)})

        try:
            self.conn.commit()
        except Exception as e:
            return {"success": False, "error": f"Commit failed: {str(e)}"}

        return {
            "success": len(errors) == 0,
            "loaded_tables": loaded_tables,
            "errors": errors
        }

    def load_dataframe(self, df: pd.DataFrame, table_name: str, truncate: bool = True) -> dict:
        """
        Load a pandas DataFrame into a database table.
        """
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            if truncate:
                self.cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

            df.to_sql(table_name, self.conn, index=False, if_exists="replace" if truncate else "append")
            self.conn.commit()
            return {"success": True, "table": table_name}
        except Exception as e:
            return {"success": False, "error": str(e), "table": table_name}

    def import_from_sqlite_file(self, file_path: str) -> None:
        """
        Attach another SQLite database file and copy its tables into the current DB.
        """
        if not self.conn:
            raise ValueError("Database not connected.")

        try:
            self.cursor.execute(f"ATTACH DATABASE '{file_path}' AS imported_db")

            # Get all table names from the attached DB
            self.cursor.execute("SELECT name FROM imported_db.sqlite_master WHERE type='table'")
            tables = [row[0] for row in self.cursor.fetchall()]

            for table in tables:
                self.cursor.execute(f"DROP TABLE IF EXISTS {table}")
                self.cursor.execute(f"CREATE TABLE {table} AS SELECT * FROM imported_db.{table}")

            self.cursor.execute("DETACH DATABASE imported_db")
            self.conn.commit()
        except Exception as e:
            raise RuntimeError(f"Failed to import .db file: {str(e)}")

    def get_table_names(self) -> list:
        """
        Return the list of tables in the database.
        """
        if not self.conn:
            return []

        self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row[0] for row in self.cursor.fetchall()]

    def clear_database(self) -> Dict[str, Any]:
        """
        Clears all tables and data from the database.

        Returns:
            Dict[str, Any]: A dictionary indicating success/failure and a message.
        """
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            tables_result = self.list_tables()
            if not tables_result["success"]:
                return {"success": False, "error": "Failed to retrieve table list."}

            tables = [row["name"] for row in tables_result.get("data", [])]
            dropped_tables = []
            errors = []

            for table in tables:
                try:
                    self.cursor.execute(f"DROP TABLE IF EXISTS {table};")
                    dropped_tables.append(table)
                except sqlite3.Error as e:
                    errors.append({"table": table, "error": str(e)})

            self.conn.commit()

            if errors:
                return {
                    "success": False,
                    "message": f"Cleared some tables, but encountered errors: {len(errors)} errors.",
                    "dropped_tables": dropped_tables,
                    "errors": errors
                }
            else:
                return {
                    "success": True,
                    "message": f"Successfully cleared all {len(dropped_tables)} tables.",
                    "dropped_tables": dropped_tables
                }
        except Exception as e:
            self.conn.rollback()
            return {"success": False, "error": f"An unexpected error occurred: {e}"}

if __name__ == "__main__":
    import json


    def run_test(name: str, func, *args, **kwargs):
        """Helper function to run and print test results."""
        print(f"\n--- Test: {name} ---")
        result = func(*args, **kwargs)
        print(json.dumps(result, indent=2))
        return result


    db = LocalSQLiteDatabase()  # In-memory for quick test
    create_table_result = db.execute_sql("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    );
    INSERT INTO users (name) VALUES ('Alice');
    """, multi_statement=True)
    print(f"CREATE TABLE result: {create_table_result}")
    if not create_table_result["success"]:
        print(f"Error creating table: {create_table_result.get('error')}")

    list_tables_result = db.list_tables()
    print(f"List tables result after creation attempt: {list_tables_result}")
    x = db.export_all_data()
    print(x)

    print(db.load_all_data(x["data"]))


