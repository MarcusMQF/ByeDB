import os 
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

# Load environment variables
load_dotenv()
from supabase._sync.client import create_client
from supabase._sync.client import SyncClient as Client

class SupabaseClient:
    _instance: 'SupabaseClient' = None
    _client: Client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if not url or not key:
                raise ValueError("Supabase URL and Key must be set in environment variables.")
            cls._client = create_client(url, key)
        return cls._instance
    
    @classmethod
    def get_instance(cls) -> 'SupabaseClient':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @property
    def client(self) -> Client:
        return self._client
    
    def create_table(self, table_name: str, columns: Dict[str, str]) -> Dict[str, Any]:
        try:
            column_definitions = []
            for col_name, col_type in columns.items():
                column_definitions.append(f"{col_name} {col_type}")
            
            sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_definitions)})"
            
            result = self._client.rpc('execute_sql', {'sql': sql}).execute()
            return {"success": True, "message": f"Table {table_name} created successfully", "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self._client.table(table_name).insert(data).execute()
            return {"success": True, "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def read(self, table_name: str, filters: Optional[Dict[str, Any]] = None, 
             columns: Optional[str] = "*", limit: Optional[int] = None) -> Dict[str, Any]:
        try:
            query = self._client.table(table_name).select(columns)
            
            # Apply filters
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return {"success": True, "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update(self, table_name: str, data: Dict[str, Any], 
               filters: Dict[str, Any]) -> Dict[str, Any]:
        try:
            query = self._client.table(table_name).update(data)
            
            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return {"success": True, "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete(self, table_name: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        try:
            query = self._client.table(table_name).delete()
            
            # Apply filters
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return {"success": True, "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        try:
            result = self._client.rpc('execute_sql', {'sql': query}).execute()
            return {"success": True, "data": result.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        try:
            # Query information_schema to get table structure
            query = f"""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position;
            """
            result = self.execute_query(query)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_tables(self) -> Dict[str, Any]:
        try:
            query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
            """
            result = self.execute_query(query)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    