import sys
import asyncio

# Must be at the absolute top of main.py for Windows Playwright compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import create_mongo_client
from app.db.indexes import create_indexes

# Consolidate your imports
from app.api.routes.jobs import router as jobs_router
from app.api.routes.auth import router as auth_router
from app.api.routes import extension, profile
from app.core.logging import setup_logging

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = create_mongo_client()
    try:
        print("Connecting to MongoDB...")
        database = client[settings.mongodb_database]
        await database.command("ping")
        print("MongoDB connected successfully")
        
        await create_indexes(database)
        
        app.state.mongodb_client = client
        app.state.database = database
        yield
    except Exception as error:
        print("MongoDB connection failed:")
        print(error)
        raise
    finally:
        await client.close()
        print("MongoDB connection closed")

# Initialize app exactly ONCE
app = FastAPI(
    title="JobPilot.AI Backend",
    description="AI-powered job discovery and application platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(jobs_router)
app.include_router(auth_router)
app.include_router(extension.router, prefix="/api")
app.include_router(profile.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "JobPilot.AI API",
        "status": "running",
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }