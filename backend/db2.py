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


if __name__ == "__main__":
    import os
    import json

    def run_test(name: str, func: callable, *args, **kwargs):
        """Helper function to run and print test results."""
        print(f"\n--- Test: {name} ---")
        result = func(*args, **kwargs)
        print(json.dumps(result, indent=2))
        return result

    # --- Test In-Memory Database ---
    print("\n--- Running In-Memory Database Tests ---")
    db_memory = LocalSQLiteDatabase()

    # Test 1: List Tables (initially empty)
    run_test("List Tables (initial)", db_memory.list_tables)

    # Test 2: Create Table using execute_sql
    run_test("Create 'users' table using execute_sql", db_memory.execute_sql, """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE
        )
    """)

    # Test 3: List Tables (after creating 'users')
    run_test("List Tables (after creating 'users')", db_memory.list_tables)

    # Test 4: Get Table Info for 'users'
    run_test("Get Table Info for 'users'", db_memory.get_table_info, "users")

    # Test 5: Insert Data using execute_sql
    run_test("Insert User 1 (Alice) using execute_sql", db_memory.execute_sql,
             "INSERT INTO users (name, email) VALUES (?, ?)", ("Alice", "alice@example.com"))
    run_test("Insert User 2 (Bob) using execute_sql", db_memory.execute_sql,
             "INSERT INTO users (name, email) VALUES (?, ?)", ("Bob", "bob@example.com"))

    # Test 6: Insert Duplicate Email (Expected Failure) using execute_sql
    run_test("Insert Duplicate Email (Expected Failure) using execute_sql", db_memory.execute_sql,
             "INSERT INTO users (name, email) VALUES (?, ?)", ("Charlie", "alice@example.com"))

    # Test 7: Select All Data using execute_sql
    run_test("Select All Users using execute_sql", db_memory.execute_sql, "SELECT * FROM users")

    # Test 8: Select Data with Condition using execute_sql
    run_test("Select User by Name (Alice) using execute_sql", db_memory.execute_sql,
             "SELECT * FROM users WHERE name = ?", ("Alice",))

    # Test 9: Update Data using execute_sql
    run_test("Update Alice's Email using execute_sql", db_memory.execute_sql,
             "UPDATE users SET email = ? WHERE name = ?", ("alice.smith@example.com", "Alice"))
    run_test("Verify Alice's Updated Email using execute_sql", db_memory.execute_sql,
             "SELECT * FROM users WHERE name = ?", ("Alice",))

    # Test 10: Delete Data using execute_sql
    run_test("Delete Bob using execute_sql", db_memory.execute_sql,
             "DELETE FROM users WHERE name = ?", ("Bob",))
    run_test("Verify Bob Deleted using execute_sql", db_memory.execute_sql, "SELECT * FROM users")

    # Test 11: Get Table Info (non-existent table)
    run_test("Get Table Info (non-existent table)", db_memory.get_table_info, "non_existent_table")

    # Test 12: Execute SQL with Syntax Error (Expected Failure)
    run_test("Execute SQL with Syntax Error (Expected Failure)", db_memory.execute_sql, "SELECT FROM users")

    # Test 13: Drop Table using execute_sql
    run_test("Drop 'users' table using execute_sql", db_memory.execute_sql, "DROP TABLE users")

    # Test 14: List Tables (empty after drop)
    run_test("List Tables (after dropping 'users')", db_memory.list_tables)

    db_memory.close()

    # --- Test File-based Database ---
    print("\n--- Running File-based Database Tests ---")
    file_db_path = "my_local_test_database.db"
    # Ensure a clean start for file-based tests
    if os.path.exists(file_db_path):
        os.remove(file_db_path)

    db_file = LocalSQLiteDatabase(file_db_path)

    # Test 15: Create 'products' table using execute_sql
    run_test("Create 'products' table in file DB using execute_sql", db_file.execute_sql, """
        CREATE TABLE products (
            product_id INTEGER PRIMARY KEY,
            product_name TEXT NOT NULL,
            price REAL
        )
    """)

    # Test 16: Insert products using execute_sql
    run_test("Insert Laptop using execute_sql", db_file.execute_sql,
             "INSERT INTO products (product_name, price) VALUES (?, ?)", ("Laptop", 1200.00))
    run_test("Insert Mouse using execute_sql", db_file.execute_sql,
             "INSERT INTO products (product_name, price) VALUES (?, ?)", ("Mouse", 25.50))

    # Test 17: Query products using execute_sql
    run_test("Query products using execute_sql", db_file.execute_sql, "SELECT * FROM products")

    db_file.close()

    # Test 18: Verify data persistence by reopening the file-based database
    print("\n--- Reopening File-based Database to Verify Persistence ---")
    db_file_reopen = LocalSQLiteDatabase(file_db_path)
    run_test("Products data after reopening", db_file_reopen.execute_sql, "SELECT * FROM products")
    db_file_reopen.close()

    # Clean up the test database file
    if os.path.exists(file_db_path):
        os.remove(file_db_path)
        print(f"\nCleaned up {file_db_path}")

