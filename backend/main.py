from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
import models
from database import engine
from routers import auth, projects, tasks, configs, notifications, admin
from admin_panel import register_admin
import os

# Create tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

# Register SQLAdmin panel at /admin (see admin_panel.py for model views)
register_admin(app, engine)

# Trust X-Forwarded-Proto from PythonAnywhere's nginx so HTTPS URLs are generated correctly
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/assets/") or request.url.path == "/":
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(configs.router)
app.include_router(notifications.router)
app.include_router(admin.router)

frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../frontend/dist")
)

app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(frontend_dist, "assets")),
    name="assets",
)

@app.get("/vite.svg")
async def serve_vite_svg():
    return FileResponse(os.path.join(frontend_dist, "vite.svg"))

# SPA fallback using 404 handler instead of catch-all GET route
# This way SQLAdmin mount handles /admin BEFORE anything can block it
@app.exception_handler(404)
async def spa_fallback(request: Request, exc: HTTPException):
    if request.url.path.startswith("/admin"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    index = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return JSONResponse({"detail": "Not Found"}, status_code=404)
