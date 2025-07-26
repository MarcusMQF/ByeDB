from collections import OrderedDict
from db_sqlite import LocalSQLiteDatabase
from llm_sql_agent import SQLAgent


class UserSession:
    def __init__(self, database: LocalSQLiteDatabase, agent: SQLAgent):
        self.database = database
        self.agent = agent

    @classmethod
    async def create(cls):
        db = LocalSQLiteDatabase(db_path=":memory:")
        await db.connect()
        agent = SQLAgent(db)
        return cls(db, agent)


class LRUUserContext:
    def __init__(self, capacity=50):
        self.capacity = capacity
        self.sessions = OrderedDict()  # {user_id: UserSession}

    async def get_session(self, user_id: str) -> UserSession:
        print(f"get_session:User id: {user_id}")
        if user_id in self.sessions:
            self.sessions.move_to_end(user_id)
        else:
            if len(self.sessions) >= self.capacity:
                evicted_user, _ = self.sessions.popitem(last=False)
                print(f"Evicted user: {evicted_user}")
            self.sessions[user_id] = await UserSession.create()
        return self.sessions[user_id]

    async def get_user_database(self, user_id: str) -> LocalSQLiteDatabase:
        session = await self.get_session(user_id)
        return session.database

    async def get_user_agent(self, user_id: str) -> SQLAgent:
        session = await self.get_session(user_id)
        return session.agent

    def delete_user(self, user_id: str):
        if user_id in self.sessions:
            del self.sessions[user_id]
            print(f"Deleted user: {user_id}")



