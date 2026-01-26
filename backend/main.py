from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import auth, projects, tasks, configs, notifications
import os

# Create tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, change to: ["https://yokesh17.pythonanywhere.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware to disable caching during development
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Disable caching for static assets during development
        if request.url.path.startswith('/assets/') or request.url.path == '/':
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response

app.add_middleware(NoCacheMiddleware)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(configs.router)
app.include_router(notifications.router)

from fastapi.staticfiles import StaticFiles


frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../frontend/dist")
)

# Serve static assets (JS, CSS, images)
app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(frontend_dist, "assets")),
    name="assets",
)

# Serve vite.svg and other root-level static files
@app.get("/vite.svg")
async def serve_vite_svg():
    return FileResponse(os.path.join(frontend_dist, "vite.svg"))

# Catch-all route for SPA - serves index.html for all non-API routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Catch-all route to serve the React SPA.
    Returns index.html for any route that doesn't match API endpoints.
    This enables client-side routing to work on refresh.
    """
    # If the request is for a specific file that exists, serve it
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise, serve index.html (for SPA routing)
    return FileResponse(os.path.join(frontend_dist, "index.html"))

