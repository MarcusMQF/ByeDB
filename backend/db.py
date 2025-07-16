import os 
from supabase._sync.client import create_client
from supabase._sync.client import SyncClient as Client

class SupabaseClient:
    _instance: Client | None = None

    def __new__(cls):
        if cls._instance is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if not url or not key:
                raise ValueError("Supabase URL and Key must be set in environment variables.")
            cls._instance = create_client(url, key)
        return cls._instance