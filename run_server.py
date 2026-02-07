#!/usr/bin/env python3
"""
Run the Proxi backend server continuously.
Chatbot runs only when the frontend sends a request (POST /chat/send).

Usage:
  python run_server.py

Then start the frontend (npm run dev) and use the AI Agent Chat.
Set GOOGLE_API_KEY or GEMINI_API_KEY in .env for Gemini-powered step generation.
"""
import uvicorn
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    uvicorn.run(
        "src.mcp_server.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
