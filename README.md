<div align="center">
<img src="frontend/public/icon.png" alt="ByeDB Logo" width="200"/>
<h1>ByeDB.AI</h1>
<p><em>Effortless, AI-powered database exploration and prompt engineering—ByeDB lets you query, analyze, and visualize your data with natural language and modern UI, bridging the gap between raw data and actionable insights.</em></p>

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](README.md)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](README.md)

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

ByeDB is a cutting-edge, AI-augmented database interface that revolutionizes how users interact with their data. Built for data analysts, engineers, researchers, and business professionals, ByeDB eliminates the complexity of SQL by enabling natural language database queries and providing intelligent data visualization.

**Key Capabilities:**
- **Natural Language Processing**: Transform plain English questions into optimized SQL queries
- **Multi-LLM Integration**: Leverage both OpenAI GPT and Google Gemini for enhanced query generation
- **Intelligent Prompt Engineering**: Automatic prompt enhancement for improved AI understanding
- **Real-time Data Visualization**: Interactive charts, tables, and dashboards
- **Privacy-First Design**: Local execution ensures your data never leaves your environment
- **Enterprise-Ready**: Scalable architecture with robust error handling and monitoring

---

## Features

### 🧠 **AI-Powered Query Engine**
- **Natural Language Querying** – Ask questions in plain English and receive SQL + results
- **Prompt Enhancement** – AI refines your prompts for optimal LLM performance
- **Multi-LLM Support** – Switch between OpenAI GPT and Google Gemini models
- **Query Optimization** – Intelligent SQL generation with performance considerations

### 📊 **Data Management & Visualization**
- **Data Import** – Upload CSV/XLSX files with automatic schema detection
- **Interactive Table View** – Browse, filter, sort, and search your data visually
- **Dashboard Analytics** – Rich visualizations with charts, graphs, and summaries
- **Export Capabilities** – Download results in multiple formats (CSV, Excel, SQLite)

### 🔒 **Security & Performance**
- **Local Execution** – Runs entirely on your infrastructure
- **Data Privacy** – Your data never leaves your environment
- **Session Management** – Secure user sessions with memory isolation
- **Optimized Performance** – Efficient query execution and caching

### 🛠 **Developer Experience**
- **Modern Tech Stack** – Next.js, TypeScript, FastAPI, SQLite
- **RESTful API** – Clean, documented endpoints for integration
- **Component Library** – Reusable UI components with Tailwind CSS
- **Error Handling** – Comprehensive error reporting and debugging

---

## Architecture

ByeDB follows a modern microservices architecture with clear separation of concerns:

<div align="center">
<img src="frontend/public/images/architecture.png" alt="ByeDB Architecture Diagram" width="800"/>
</div>

### **System Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│ OpenAI/Gemini   │
│                 │    │                 │    │                 │
│ • React/TS      │    │ • Python        │    │ • GPT Models    │
│ • Tailwind CSS  │    │ • SQLite        │    │ • Gemini Pro    │
│ • Components    │    │ • Data Proc.    │    │ • Prompt Eng.   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **AI Query Pipeline**
Based on the architecture diagram above, here's the detailed flow:

#### **Client Layer**
1. **Natural Language Input** – User enters questions in plain English
2. **Agent Output** – System provides responses and results
3. **Buttons** – Interactive UI controls for user actions
4. **File Transfer** – Upload/download functionality for data files

#### **Server Layer**
5. **Query API** – Processes incoming natural language requests
6. **Present to Client** – Formats and returns results to frontend
7. **Get Confirmation from User** – Handles user interactions and confirmations
8. **Upload and Export API** – Manages file operations

#### **SQL Agent Layer** 
9. **System Prompt** – Initial instructions for the AI agent
10. **User Input** – Processed natural language query
11. **Memory** – Maintains conversation context and history
12. **Agent Prompt** – Enhanced prompt sent to LLM

#### **AI Processing (Gemini 2.5 Flash)**
13. **LLM Processing** – Gemini 2.5 Flash generates SQL and responses
14. **Response Generation** – Creates appropriate SQL queries and explanations
15. **More Information Needed** – Handles cases requiring clarification
16. **Action Needed** – Determines next steps in the process
17. **Clarification Needed** – Requests additional user input when necessary

#### **Model Context Protocol**
18. **Read Query** – Retrieves and processes database queries  
19. **Write Query** – Executes SQL commands on the database

#### **Database Layer**
20. **SQLite Database** – Local data storage and query execution

This architecture ensures:
- **Separation of Concerns**: Clear boundaries between UI, API, AI, and Data layers
- **Scalable Design**: Modular components that can be independently updated
- **Security**: Local execution with no external data transmission
- **Flexibility**: Support for multiple LLM providers and query types

---

## API Design

### **Core Endpoints**

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/sql-question` | POST | Execute natural language query | `{question: string, userId: string, llm_choice?: string}` | Query results + SQL |
| `/api/continue-execution` | POST | Continue previous query execution | `{userId: string, execution_id: string}` | Continued results |
| `/api/upload-db` | POST | Upload CSV/Excel data files | `FormData: files[]` | Upload status |
| `/api/export-db` | GET | Export database as SQLite | `userId` (header) | SQLite file download |
| `/api/export-csv` | GET | Export query results as CSV | `userId` (header) | CSV file download |
| `/api/clear-memory` | POST | Clear user session memory | `{userId: string}` | Success status |
| `/api/clear-database` | POST | Clear user database | `{userId: string}` | Success status |
| `/api/delete-account` | POST | Delete user account & data | `{userId: string}` | Success status |

### **Request/Response Schemas**

#### SQL Question Request
```json
{
  "question": "Show me the top 10 customers by revenue",
  "userId": "user-uuid-here",
  "llm_choice": "gemini" // optional: "gpt" or "gemini"
}
```

#### SQL Question Response
```json
{
  "success": true,
  "sql_query": "SELECT customer_name, SUM(revenue) as total_revenue FROM customers GROUP BY customer_name ORDER BY total_revenue DESC LIMIT 10",
  "results": [
    {"customer_name": "Acme Corp", "total_revenue": 150000},
    {"customer_name": "TechStart Inc", "total_revenue": 125000}
  ],
  "execution_time": 0.045,
  "row_count": 10,
  "enhanced_prompt": "Retrieve the top 10 customers ranked by their total revenue contribution..."
}
```

---

### **API Integration Examples**

#### JavaScript/TypeScript
```typescript
// Query execution
const response = await fetch('/api/sql-question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-ID': userId
  },
  body: JSON.stringify({
    question: "What are our top selling products?",
    userId: userId,
    llm_choice: "gemini"
  })
});

const result = await response.json();
```

#### Python
```python
import requests

# Upload data
files = {'files': open('data.csv', 'rb')}
response = requests.post(
    'http://localhost:8000/api/upload-db',
    files=files,
    headers={'User-ID': user_id}
)
```

---

## Quick Start

### **Prerequisites**
- **Node.js** 18+ and npm/yarn
- **Python** 3.8+ and pip
- **OpenAI API Key** or **Google AI API Key**

### **1. Clone Repository**
```bash
git clone https://github.com/MarcusMQF/ByeDB.git
cd ByeDB
```

### **2. Backend Setup**
```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-api-key"
export GOOGLE_API_KEY="your-gemini-key"

# Start backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **4. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Installation

### **Development Environment**

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend && pip install -r requirements.txt
   
   # Frontend  
   cd frontend && npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file in backend/
   echo "OPENAI_API_KEY=your_key" >> backend/.env
   echo "GOOGLE_API_KEY=your_key" >> backend/.env
   ```

3. **Database Setup**
   ```bash
   # SQLite database is created automatically
   # Upload sample data via the web interface
   ```

### **Production Deployment**

#### **Docker Deployment** (Recommended)
```dockerfile
# Coming soon - Docker configuration
# Supports containerized deployment with docker-compose
```

#### **Manual Deployment**
```bash
# Backend (production)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (production)
cd frontend
npm run build
npm start
```

---

## Configuration

### **Backend Configuration**
- **Database**: SQLite with automatic user isolation
- **AI Models**: Configurable OpenAI/Gemini endpoints
- **Security**: CORS, input validation, query sanitization
- **Performance**: Connection pooling, query caching

### **Frontend Configuration**
- **Themes**: Dark/light mode support
- **Components**: Modular design with shadcn/ui
- **State Management**: React hooks and context
- **Responsive**: Mobile-first design approach

---

## Usage

1. **Upload Data**: Drag and drop CSV/Excel files
2. **Ask Questions**: Type natural language queries
3. **View Results**: Interactive tables and visualizations
4. **Export Data**: Download results in multiple formats
5. **Manage Sessions**: Clear memory or reset database

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/Contributing.md) for details.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<p><strong>Built by Hardcoded Our Life</strong></p>
<p>
<a href="https://github.com/MarcusMQF/ByeDB">🌟 Star us on GitHub</a> |
<a href="https://github.com/MarcusMQF/ByeDB/issues">🐛 Report Issues</a> |
<a href="https://github.com/MarcusMQF/ByeDB/discussions">💬 Discussions</a>
</p>
</div>