<div align="center">
<img src="frontend/public/icon.png" alt="ByeDB Logo" width="200"/>
<h1>ByeDB</h1>
<p>Effortless, AI-powered database exploration and prompt engineering—ByeDB lets you query, analyze, and visualize your data with natural language and modern UI, bridging the gap between raw data and actionable insights.</p>
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
<img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/>
<img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini"/>
</div>

## About 

ByeDB is a modern, AI-augmented database interface that empowers users to interact with their data using natural language. Designed for analysts, engineers, and anyone who wants to unlock insights from their databases without writing complex SQL, ByeDB combines a powerful Python backend with a sleek Next.js frontend. It supports prompt enhancement, LLM-powered query generation, and instant data visualization.

Features 🚀
Natural Language Querying – Ask questions in plain English and get SQL + results
Prompt Enhancement – Refine your prompts for better LLM output
Multi-LLM Support – Switch between OpenAI GPT and Google Gemini for query generation
Data Import – Upload CSV/XLSX files and explore instantly
Interactive Table View – Browse, filter, and sort your data visually
Dashboard Analytics – Visualize query results with charts and summaries
Secure & Local – Runs locally, your data stays private
AI Query System 🤖
ByeDB’s query pipeline:
Prompt Input – User enters a question or request
Prompt Enhancement – (Optional) LLM refines the prompt for clarity
LLM SQL Generation – OpenAI or Gemini generates SQL from the prompt
SQL Execution – Backend runs the SQL on your SQLite database
Result Visualization – Data is displayed in tables and charts
cd backend; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000