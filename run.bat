@echo off
echo Starting frontend...
start /min cmd /k "cd frontend && npm install && npm run dev"

echo Starting backend...
start /min cmd /k "cd backend && uvicorn main:app --reload"

echo Both frontend and backend are starting in separate windows.
echo local:     http://localhost:3000/