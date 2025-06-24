#!/usr/bin/env python3
"""
Startup script for the Document Processor API
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8000))
    
    print("🚀 Starting Document Processor API...")
    print(f"📡 Server will be available at: http://localhost:{port}")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Health check: http://localhost:8000/api/health")
    print("\nPress Ctrl+C to stop the server")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    ) 