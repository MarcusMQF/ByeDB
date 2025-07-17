import sqlite3
from typing import Dict, Any, List, Optional, Tuple

class LocalSQLiteDatabase:
    """
    A local SQLite database client with methods for common operations
    and a generic execute_sql function.
    """

    def __init__(self, db_path: Optional[str] = ':memory:'):
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
            self.conn.row_factory = sqlite3.Row # Allows accessing columns by name
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

    def execute_sql(self, sql_query: str, params: Tuple = ()) -> Dict[str, Any]:
        """
        Executes an arbitrary SQL query.

        Args:
            sql_query (str): The SQL query string to execute.
            params (Tuple): Parameters to bind to the SQL query (for parameterized queries).

        Returns:
            Dict[str, Any]: A dictionary indicating success/failure, a message, and data (if any).
        """
        if not self.conn:
            return {"success": False, "error": "Database not connected."}

        try:
            self.cursor.execute(sql_query, params)
            # Check if the query was a SELECT statement
            if sql_query.strip().upper().startswith("SELECT"):
                rows = self.cursor.fetchall()
                # Convert rows to list of dictionaries for easier handling
                data = [dict(row) for row in rows]
                return {"success": True, "message": "Query executed successfully.", "data": data}
            else:
                self.conn.commit() # Commit changes for non-SELECT queries
                return {"success": True, "message": "Command executed successfully.", "data": []}
        except sqlite3.Error as e:
            self.conn.rollback() # Rollback in case of error
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"An unexpected error occurred: {e}"}

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