"""
Script to serve the demo application.

This script starts the FastAPI backend and serves the static HTML file.
"""
import os
import sys
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import the demo app
from run_demo import app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mount static files
app.mount("/demo", StaticFiles(directory="demo", html=True), name="demo")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a redirect from root to demo
@app.get("/")
async def redirect_to_demo():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/demo")

# Main function
def main():
    logger.info("Starting demo server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
