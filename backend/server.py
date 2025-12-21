from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'veoprompt-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Gemini API Key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Create videos directory
VIDEOS_DIR = ROOT_DIR / 'videos'
VIDEOS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="VeoPrompt - AI Video Prompt Generator")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    description: str
    created_at: str

class PromptGenerateRequest(BaseModel):
    niche: str
    platform: str = "instagram"  # instagram, youtube_shorts, tiktok, x
    video_length: int = 30  # 10-60 seconds
    tone: str = "cinematic"  # cinematic, emotional, aggressive, calm, energetic
    goal: str = "engagement"  # engagement, virality, education, conversion
    custom_idea: Optional[str] = ""

class PromptResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    project_id: Optional[str]
    niche: str
    platform: str
    video_length: int
    tone: str
    goal: str
    custom_idea: str
    generated_prompt: dict
    raw_prompt_text: str
    created_at: str
    status: str  # draft, approved, generating, completed

class VideoGenerateRequest(BaseModel):
    prompt_id: str

class VideoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    prompt_id: str
    status: str  # queued, processing, completed, failed
    video_url: Optional[str]
    duration: Optional[int]
    resolution: Optional[str]
    created_at: str
    completed_at: Optional[str]

class PerformanceMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    video_id: str
    views: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    watch_time_avg: float = 0.0
    updated_at: str

class PerformanceUpdate(BaseModel):
    views: Optional[int] = None
    likes: Optional[int] = None
    shares: Optional[int] = None
    comments: Optional[int] = None
    watch_time_avg: Optional[float] = None

class DashboardStats(BaseModel):
    total_prompts: int
    total_videos: int
    videos_processing: int
    videos_completed: int
    total_views: int
    total_likes: int


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================== PROMPT ENGINEER AGENT ====================

PROMPT_SYSTEM_MESSAGE = """You are an expert AI Video Prompt Engineer specialized in creating highly optimized, cinematic video prompts for short-form content platforms like Instagram Reels, YouTube Shorts, and TikTok.

Your task is to generate detailed, scene-by-scene video prompts that maximize viewer retention and engagement. Every prompt you create must follow this structure:

1. HOOK (First 3 seconds) - The most critical element. Must immediately capture attention.
2. SCENE BREAKDOWN - Detailed visual descriptions scene by scene
3. VISUAL STYLE - Specific cinematography, lighting, and color grading
4. CAMERA MOVEMENTS - Dynamic shots, transitions
5. TEXT OVERLAYS - Safe for mobile, impactful copy
6. PACING & EMOTION - Rhythm and emotional arc
7. AUDIO SUGGESTIONS - Music style, sound effects
8. CONSTRAINTS - Always vertical 9:16, no watermarks, subtitle-friendly

Your prompts should be specific enough for AI video generation tools like Gemini Veo to produce consistent, high-quality results.

Always respond in valid JSON format with this exact structure:
{
    "hook": {
        "description": "visual description of first 3 seconds",
        "text_overlay": "attention-grabbing text",
        "emotion": "emotion to evoke"
    },
    "scenes": [
        {
            "scene_number": 1,
            "duration_seconds": 5,
            "visual_description": "detailed visual",
            "camera_movement": "type of movement",
            "text_overlay": "optional text",
            "transition_to_next": "transition type"
        }
    ],
    "visual_style": {
        "cinematography": "style description",
        "lighting": "lighting setup",
        "color_grade": "color palette",
        "mood": "overall mood"
    },
    "audio": {
        "music_style": "genre/tempo",
        "sound_effects": ["effect1", "effect2"],
        "voiceover": "if applicable"
    },
    "metadata": {
        "aspect_ratio": "9:16",
        "total_duration": 30,
        "platform_optimization": "platform name",
        "retention_hooks": ["hook1", "hook2"]
    }
}"""

async def generate_video_prompt(request: PromptGenerateRequest) -> dict:
    """Use Gemini 2.5 Flash to generate optimized video prompt"""
    
    user_prompt = f"""Create a highly engaging short-form video prompt with these specifications:

NICHE/TOPIC: {request.niche}
TARGET PLATFORM: {request.platform}
VIDEO LENGTH: {request.video_length} seconds
TONE: {request.tone}
GOAL: {request.goal}
{"CUSTOM IDEA: " + request.custom_idea if request.custom_idea else ""}

Generate a complete video prompt following the exact JSON structure specified. Make it highly specific, visually compelling, and optimized for maximum engagement and retention on {request.platform}."""

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"prompt-gen-{uuid.uuid4()}",
            system_message=PROMPT_SYSTEM_MESSAGE
        ).with_model("gemini", "gemini-2.5-flash")
        
        message = UserMessage(text=user_prompt)
        response = await chat.send_message(message)
        
        # Parse the JSON response
        import json
        # Clean up response - sometimes LLM adds markdown
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        prompt_data = json.loads(response_text.strip())
        return {
            "success": True,
            "prompt": prompt_data,
            "raw_text": response
        }
    except Exception as e:
        logger.error(f"Prompt generation error: {e}")
        # Return a default template if generation fails
        return {
            "success": False,
            "error": str(e),
            "prompt": {
                "hook": {
                    "description": f"Captivating {request.niche} opening shot",
                    "text_overlay": f"You won't believe this {request.niche} secret...",
                    "emotion": "curiosity"
                },
                "scenes": [
                    {
                        "scene_number": 1,
                        "duration_seconds": request.video_length // 3,
                        "visual_description": f"Dynamic {request.niche} content establishing shot",
                        "camera_movement": "slow zoom",
                        "text_overlay": "",
                        "transition_to_next": "smooth fade"
                    }
                ],
                "visual_style": {
                    "cinematography": request.tone,
                    "lighting": "professional studio",
                    "color_grade": "modern cinematic",
                    "mood": request.tone
                },
                "audio": {
                    "music_style": f"{request.tone} background track",
                    "sound_effects": [],
                    "voiceover": "optional narration"
                },
                "metadata": {
                    "aspect_ratio": "9:16",
                    "total_duration": request.video_length,
                    "platform_optimization": request.platform,
                    "retention_hooks": ["opening hook", "mid-video reveal"]
                }
            },
            "raw_text": f"Generated default template for {request.niche}"
        }


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


# ==================== PROJECT ROUTES ====================

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": project.name,
        "description": project.description or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    return ProjectResponse(**project_doc)

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return [ProjectResponse(**p) for p in projects]


# ==================== PROMPT ROUTES ====================

@api_router.post("/prompts/generate", response_model=PromptResponse)
async def generate_prompt(request: PromptGenerateRequest, current_user: dict = Depends(get_current_user)):
    # Generate the prompt using AI
    result = await generate_video_prompt(request)
    
    prompt_id = str(uuid.uuid4())
    prompt_doc = {
        "id": prompt_id,
        "user_id": current_user["id"],
        "project_id": None,
        "niche": request.niche,
        "platform": request.platform,
        "video_length": request.video_length,
        "tone": request.tone,
        "goal": request.goal,
        "custom_idea": request.custom_idea or "",
        "generated_prompt": result["prompt"],
        "raw_prompt_text": result.get("raw_text", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "draft"
    }
    
    await db.prompts.insert_one(prompt_doc)
    return PromptResponse(**prompt_doc)

@api_router.get("/prompts", response_model=List[PromptResponse])
async def get_prompts(current_user: dict = Depends(get_current_user), limit: int = 50):
    prompts = await db.prompts.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [PromptResponse(**p) for p in prompts]

@api_router.get("/prompts/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    prompt = await db.prompts.find_one(
        {"id": prompt_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return PromptResponse(**prompt)

@api_router.patch("/prompts/{prompt_id}/approve")
async def approve_prompt(prompt_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.prompts.update_one(
        {"id": prompt_id, "user_id": current_user["id"]},
        {"$set": {"status": "approved"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"message": "Prompt approved"}


# ==================== VIDEO ROUTES ====================

@api_router.post("/videos/generate", response_model=VideoResponse)
async def generate_video(request: VideoGenerateRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Verify prompt exists and belongs to user
    prompt = await db.prompts.find_one(
        {"id": request.prompt_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    video_id = str(uuid.uuid4())
    video_doc = {
        "id": video_id,
        "user_id": current_user["id"],
        "prompt_id": request.prompt_id,
        "status": "queued",
        "video_url": None,
        "duration": prompt.get("video_length", 30),
        "resolution": "1080x1920",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.videos.insert_one(video_doc)
    
    # Update prompt status
    await db.prompts.update_one(
        {"id": request.prompt_id},
        {"$set": {"status": "generating"}}
    )
    
    # Queue video generation (mock for MVP - Veo API not publicly available)
    background_tasks.add_task(process_video_generation, video_id, prompt)
    
    return VideoResponse(**video_doc)

async def process_video_generation(video_id: str, prompt: dict):
    """Background task to process video generation"""
    import asyncio
    
    try:
        # Update status to processing
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "processing"}}
        )
        
        # Simulate video generation (In production, this would call Gemini Veo API)
        # Veo API is not publicly available, so we simulate the process
        await asyncio.sleep(5)  # Simulate processing time
        
        # For MVP, we'll mark as completed with a placeholder
        # In production, this would upload to storage and return real URL
        completed_at = datetime.now(timezone.utc).isoformat()
        
        await db.videos.update_one(
            {"id": video_id},
            {
                "$set": {
                    "status": "completed",
                    "video_url": f"/api/videos/stream/{video_id}",  # Placeholder URL
                    "completed_at": completed_at
                }
            }
        )
        
        # Update prompt status
        await db.prompts.update_one(
            {"id": prompt["id"]},
            {"$set": {"status": "completed"}}
        )
        
        # Initialize performance metrics
        await db.performance.insert_one({
            "id": str(uuid.uuid4()),
            "video_id": video_id,
            "views": 0,
            "likes": 0,
            "shares": 0,
            "comments": 0,
            "watch_time_avg": 0.0,
            "updated_at": completed_at
        })
        
        logger.info(f"Video {video_id} generation completed")
        
    except Exception as e:
        logger.error(f"Video generation failed for {video_id}: {e}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "failed"}}
        )

@api_router.get("/videos", response_model=List[VideoResponse])
async def get_videos(current_user: dict = Depends(get_current_user), limit: int = 50):
    videos = await db.videos.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [VideoResponse(**v) for v in videos]

@api_router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, current_user: dict = Depends(get_current_user)):
    video = await db.videos.find_one(
        {"id": video_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoResponse(**video)


# ==================== PERFORMANCE ROUTES ====================

@api_router.get("/performance/{video_id}", response_model=PerformanceMetrics)
async def get_performance(video_id: str, current_user: dict = Depends(get_current_user)):
    # Verify video belongs to user
    video = await db.videos.find_one({"id": video_id, "user_id": current_user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    metrics = await db.performance.find_one({"video_id": video_id}, {"_id": 0})
    if not metrics:
        raise HTTPException(status_code=404, detail="Performance metrics not found")
    return PerformanceMetrics(**metrics)

@api_router.patch("/performance/{video_id}", response_model=PerformanceMetrics)
async def update_performance(video_id: str, update: PerformanceUpdate, current_user: dict = Depends(get_current_user)):
    # Verify video belongs to user
    video = await db.videos.find_one({"id": video_id, "user_id": current_user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.performance.update_one(
        {"video_id": video_id},
        {"$set": update_data}
    )
    
    metrics = await db.performance.find_one({"video_id": video_id}, {"_id": 0})
    return PerformanceMetrics(**metrics)


# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    total_prompts = await db.prompts.count_documents({"user_id": user_id})
    total_videos = await db.videos.count_documents({"user_id": user_id})
    videos_processing = await db.videos.count_documents({"user_id": user_id, "status": {"$in": ["queued", "processing"]}})
    videos_completed = await db.videos.count_documents({"user_id": user_id, "status": "completed"})
    
    # Aggregate performance metrics
    video_ids = await db.videos.distinct("id", {"user_id": user_id})
    pipeline = [
        {"$match": {"video_id": {"$in": video_ids}}},
        {"$group": {
            "_id": None,
            "total_views": {"$sum": "$views"},
            "total_likes": {"$sum": "$likes"}
        }}
    ]
    agg_result = await db.performance.aggregate(pipeline).to_list(1)
    
    total_views = agg_result[0]["total_views"] if agg_result else 0
    total_likes = agg_result[0]["total_likes"] if agg_result else 0
    
    return DashboardStats(
        total_prompts=total_prompts,
        total_videos=total_videos,
        videos_processing=videos_processing,
        videos_completed=videos_completed,
        total_views=total_views,
        total_likes=total_likes
    )

@api_router.get("/dashboard/recent-activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Get recent prompts
    recent_prompts = await db.prompts.find(
        {"user_id": user_id},
        {"_id": 0, "id": 1, "niche": 1, "platform": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(5)
    
    # Get recent videos
    recent_videos = await db.videos.find(
        {"user_id": user_id},
        {"_id": 0, "id": 1, "status": 1, "created_at": 1, "video_url": 1}
    ).sort("created_at", -1).to_list(5)
    
    return {
        "recent_prompts": recent_prompts,
        "recent_videos": recent_videos
    }


# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "VeoPrompt API - AI Video Prompt Generator", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# Include the router in the main app
app.include_router(api_router)

# Mount static files for videos
app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
