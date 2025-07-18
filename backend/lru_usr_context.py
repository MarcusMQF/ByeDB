from collections import OrderedDict
import os
from db_sqlite import LocalSQLiteDatabase
from llm_gemini import SQLExpertLLM


class UserSession:
    def __init__(self):
        self.database = LocalSQLiteDatabase(db_path=":memory:")
        self.agent = SQLExpertLLM(self.database)

class LRUUserContext:
    def __init__(self, capacity=50):
        self.capacity = capacity
        self.sessions = OrderedDict()  # {user_id: UserSession}

    def get_session(self, user_id: str) -> UserSession:
        if user_id in self.sessions:
            self.sessions.move_to_end(user_id)
        else:
            if len(self.sessions) >= self.capacity:
                evicted_user, _ = self.sessions.popitem(last=False)
                print(f"Evicted user: {evicted_user}")
            self.sessions[user_id] = UserSession()
        return self.sessions[user_id]

    def get_user_database(self, user_id: str) -> LocalSQLiteDatabase:
        return self.get_session(user_id).database

    def get_user_agent(self, user_id: str) -> SQLExpertLLM:
        return self.get_session(user_id).agent

    def delete_user(self, user_id: str):
        evicted_user, _ = self.sessions.pop(user_id)
        print(f"Deleted user: {evicted_user}")



