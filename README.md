# Local AI Companion

A private, local AI companion built with **FastAPI**, **React**, and **Ollama**.

## Features

- **Private & Local**: Runs entirely on your machine using Ollama.
- **Modern UI**: Dark-themed, responsive chat interface built with React + Vite.
- **Fast Backend**: High-performance API handling with FastAPI.
- **Memory**: (In Progress) Integration with ChromaDB for long-term memory.

## Prerequisites

- [Ollama](https://ollama.com/) installed and running.
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)

## Getting Started

### 1. Setup Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### 2. Setup Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Usage

- Ensure Ollama is running (`ollama serve`).
- Open your browser to `http://localhost:5173`.
- Start chatting!

## Project Structure

```
├── backend/          # FastAPI Backend
│   ├── app/          # Application Logic (Routers, Models, Services)
│   ├── tests/        # Verification Scripts
│   ├── main.py       # Entry Point
│   └── requirements.txt
├── frontend/         # React Frontend
│   ├── src/          # Source Code
│   └── package.json
└── README.md
```
