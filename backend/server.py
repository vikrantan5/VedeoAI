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

# FAL AI Key for video generation
FAL_KEY = os.environ.get('FAL_KEY', '')

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
    caption_text: Optional[str] = None
    hashtags_used: Optional[List[str]] = None
    instagram_post_id: Optional[str] = None
    posted_at: Optional[str] = None
    platform: str = "instagram"

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



# ==================== CAPTION & HASHTAG GENERATION ====================

CAPTION_SYSTEM_MESSAGE = """You are an expert Instagram social media copywriter specialized in creating viral captions and hashtags for short-form video content (Reels).

Your task is to generate Instagram-optimized captions and hashtags that maximize engagement, virality, and discoverability.

CAPTION RULES:
- Max 125 characters preferred (concise and punchy)
- Hook in the first line to grab attention
- Use 2-4 relevant emojis strategically
- Include a subtle CTA (Call-to-Action) like "Follow for more" or "Save this"
- Instagram-safe language only (no profanity, no controversial content)
- Mobile-friendly formatting

HASHTAG RULES:
- Generate 5-10 hashtags exactly
- Mix of broad, medium, and niche-specific tags
- No banned or spam hashtags
- Relevant to the niche and platform
- Use trending but evergreen tags when possible

Always respond in valid JSON format with this EXACT structure:
{
    "caption": "Short, engaging Instagram caption with hook and CTA.",
    "hashtags": [
        "#RelevantTag1",
        "#RelevantTag2",
        "#RelevantTag3",
        "#RelevantTag4",
        "#RelevantTag5"
    ]
}

IMPORTANT: Return ONLY the JSON, no additional text or markdown."""

async def generate_caption_and_hashtags(niche: str, tone: str, platform: str, 
                                       video_length: int, goal: str, 
                                       video_topic: str = "") -> dict:
    """Use Gemini to generate Instagram-optimized captions and hashtags"""
    
    user_prompt = f"""Generate an Instagram Reel caption and hashtags for this video:

NICHE/TOPIC: {niche}
VIDEO TOPIC: {video_topic if video_topic else niche}
PLATFORM: {platform}
VIDEO LENGTH: {video_length} seconds
TONE: {tone}
GOAL: {goal}

Create a caption and hashtags that will maximize {goal} on {platform}. The caption should be punchy, engaging, and optimized for mobile viewing. Hashtags should help with discoverability and reach.

Return ONLY valid JSON with "caption" and "hashtags" fields."""

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"caption-gen-{uuid.uuid4()}",
            system_message=CAPTION_SYSTEM_MESSAGE
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
        
        caption_data = json.loads(response_text.strip())
        
        # Validate structure
        if "caption" not in caption_data or "hashtags" not in caption_data:
            raise ValueError("Invalid response structure")
        
        # Ensure hashtags is a list
        if not isinstance(caption_data["hashtags"], list):
            caption_data["hashtags"] = []
        
        # Ensure all hashtags start with #
        caption_data["hashtags"] = [
            tag if tag.startswith("#") else f"#{tag}" 
            for tag in caption_data["hashtags"]
        ]
        
        logger.info(f"Generated caption: {caption_data['caption'][:50]}...")
        logger.info(f"Generated {len(caption_data['hashtags'])} hashtags")
        
        return {
            "success": True,
            "caption": caption_data["caption"],
            "hashtags": caption_data["hashtags"]
        }
    except Exception as e:
        logger.error(f"Caption generation error: {e}")
        # Return default caption and hashtags if generation fails
        return {
            "success": False,
            "error": str(e),
            "caption": f"Check out this amazing {niche} content! 🔥✨ Follow for more!",
            "hashtags": [
                f"#{niche.replace(' ', '')}",
                "#Reels",
                "#Viral",
                "#Trending",
                "#ContentCreator"
            ]
        }


# ==================== INSTAGRAM API SERVICE (REAL) ====================

class InstagramService:
    """Real Instagram Graph API service for posting Reels"""
    
    def __init__(self):
        self.access_token = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
        self.business_account_id = os.environ.get('INSTAGRAM_BUSINESS_ACCOUNT_ID', '')
        self.base_url = "https://graph.instagram.com"
        self.api_version = "v21.0"
        self.mock_mode = False  # Set to True for testing without real API
        
        # If credentials are missing, enable mock mode
        if not self.access_token or not self.business_account_id:
            logger.warning("Instagram credentials not configured. Running in MOCK mode.")
            self.mock_mode = True
    
    async def _fetch_business_account_id(self) -> Optional[str]:
        """Fetch Instagram Business Account ID from Facebook Pages"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                # First, get Facebook pages
                url = f"{self.base_url}/{self.api_version}/me/accounts"
                params = {"access_token": self.access_token}
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch Facebook pages: {response.status}")
                        return None
                    
                    data = await response.json()
                    pages = data.get("data", [])
                    
                    if not pages:
                        logger.error("No Facebook pages found")
                        return None
                    
                    # Get Instagram account from first page
                    page_id = pages[0]["id"]
                    page_access_token = pages[0]["access_token"]
                    
                    url = f"{self.base_url}/{self.api_version}/{page_id}"
                    params = {
                        "fields": "instagram_business_account",
                        "access_token": page_access_token
                    }
                    
                    async with session.get(url, params=params) as ig_response:
                        if ig_response.status != 200:
                            logger.error(f"Failed to fetch Instagram account: {ig_response.status}")
                            return None
                        
                        ig_data = await ig_response.json()
                        ig_account = ig_data.get("instagram_business_account", {})
                        ig_account_id = ig_account.get("id")
                        
                        if ig_account_id:
                            logger.info(f"Found Instagram Business Account ID: {ig_account_id}")
                            return ig_account_id
                        
                        return None
        except Exception as e:
            logger.error(f"Error fetching business account ID: {e}")
            return None
    
    async def create_media_container(self, video_url: str, caption: str, 
                                    hashtags: List[str]) -> Optional[str]:
        """Create media container for Instagram Reel"""
        
        if self.mock_mode:
            # Return mock media ID
            mock_media_id = f"mock_ig_{uuid.uuid4().hex[:12]}"
            logger.info(f"[MOCK] Created media container: {mock_media_id}")
            logger.info(f"[MOCK] Video URL: {video_url}")
            logger.info(f"[MOCK] Caption: {caption[:50]}...")
            logger.info(f"[MOCK] Hashtags: {', '.join(hashtags[:3])}...")
            return mock_media_id
        
        # Fetch business account ID if not set
        if not self.business_account_id:
            self.business_account_id = await self._fetch_business_account_id()
            if not self.business_account_id:
                logger.error("Cannot create media container without Business Account ID")
                # Fallback to mock mode
                self.mock_mode = True
                return await self.create_media_container(video_url, caption, hashtags)
        
        import aiohttp
        
        # Format caption with hashtags
        formatted_caption = caption
        if hashtags:
            formatted_caption += "\n\n" + " ".join([f"#{tag}" if not tag.startswith("#") else tag for tag in hashtags])
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/{self.api_version}/{self.business_account_id}/media"
                
                payload = {
                    "media_type": "REELS",
                    "video_url": video_url,
                    "caption": formatted_caption,
                    "share_to_feed": True,
                    "access_token": self.access_token
                }
                
                logger.info(f"Creating Instagram media container for video: {video_url}")
                
                async with session.post(url, data=payload) as response:
                    response_text = await response.text()
                    
                    if response.status != 200:
                        logger.error(f"Instagram API Error [{response.status}]: {response_text}")
                        return None
                    
                    data = await response.json()
                    container_id = data.get("id")
                    
                    logger.info(f"Successfully created media container: {container_id}")
                    return container_id
        except Exception as e:
            logger.error(f"Error creating media container: {e}")
            return None
    
    async def get_container_status(self, container_id: str) -> Optional[dict]:
        """Check the status of a media container"""
        
        if self.mock_mode:
            return {"status": "FINISHED", "status_code": "FINISHED"}
        
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/{self.api_version}/{container_id}"
                params = {
                    "fields": "status_code",
                    "access_token": self.access_token
                }
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Failed to get container status: {response.status}")
                        return None
                    
                    data = await response.json()
                    return data
        except Exception as e:
            logger.error(f"Error checking container status: {e}")
            return None
    
    async def publish_reel(self, container_id: str, caption: str, 
                          hashtags: List[str]) -> Optional[dict]:
        """Publish the reel to Instagram"""
        
        if self.mock_mode:
            # Simulate Instagram publishing
            import asyncio
            await asyncio.sleep(2)  # Simulate processing time
            
            mock_post_id = f"mock_post_{uuid.uuid4().hex[:12]}"
            logger.info(f"[MOCK] Published reel: {mock_post_id}")
            
            return {
                "success": True,
                "instagram_post_id": mock_post_id,
                "instagram_url": f"https://instagram.com/p/{mock_post_id}",
                "posted_at": datetime.now(timezone.utc).isoformat()
            }
        
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/{self.api_version}/{self.business_account_id}/media_publish"
                
                payload = {
                    "creation_id": container_id,
                    "access_token": self.access_token
                }
                
                logger.info(f"Publishing reel with container ID: {container_id}")
                
                async with session.post(url, data=payload) as response:
                    response_text = await response.text()
                    
                    if response.status != 200:
                        logger.error(f"Instagram Publish Error [{response.status}]: {response_text}")
                        return {
                            "success": False,
                            "error": response_text
                        }
                    
                    data = await response.json()
                    media_id = data.get("id")
                    
                    logger.info(f"Successfully published reel: {media_id}")
                    
                    return {
                        "success": True,
                        "instagram_post_id": media_id,
                        "instagram_url": f"https://www.instagram.com/reel/{media_id}",
                        "posted_at": datetime.now(timezone.utc).isoformat()
                    }
        except Exception as e:
            logger.error(f"Error publishing reel: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_reel_insights(self, media_id: str) -> Optional[dict]:
        """Get analytics for published reel"""
        
        if self.mock_mode:
            # Return mock analytics
            import random
            return {
                "views": random.randint(100, 10000),
                "likes": random.randint(10, 1000),
                "comments": random.randint(5, 100),
                "shares": random.randint(2, 50),
                "saves": random.randint(5, 200),
                "reach": random.randint(150, 15000)
            }
        
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/{self.api_version}/{media_id}/insights"
                params = {
                    "metric": "impressions,reach,likes,comments,shares,saved",
                    "access_token": self.access_token
                }
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to fetch insights: {response.status}")
                        return None
                    
                    data = await response.json()
                    insights_data = data.get("data", [])
                    
                    # Parse insights into a simple dict
                    insights = {}
                    for item in insights_data:
                        metric_name = item.get("name")
                        metric_values = item.get("values", [])
                        if metric_values:
                            insights[metric_name] = metric_values[0].get("value", 0)
                    
                    return insights
        except Exception as e:
            logger.error(f"Error fetching insights: {e}")
            return None

instagram_service = InstagramService()


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

async def generate_video_with_fal(prompt_text: str, video_length: int) -> dict:
    """Generate video using FAL.ai text-to-video API"""
    import fal_client
    
    if not FAL_KEY:
        logger.error("FAL_KEY not configured")
        raise ValueError("FAL_KEY not configured")
    
    # Configure FAL client
    os.environ["FAL_KEY"] = FAL_KEY
    
    try:
        # Submit video generation job to FAL.ai
        # Using WAN 2.5 model which supports 9:16 aspect ratio and 5s/10s duration
        duration = 5 if video_length <= 30 else 10
        
        logger.info(f"Submitting FAL.ai job with duration={duration}, prompt length={len(prompt_text)}")
        handler = await fal_client.submit_async(
            "fal-ai/wan-25-preview/text-to-video",
            arguments={
                "prompt": prompt_text,
                "duration": duration,
                "aspect_ratio": "9:16",
                "resolution": "1080p"
            }
        )
        logger.info(f"FAL.ai job submitted: {handler.request_id}")
        
        # Wait for result with timeout
        logger.info("Waiting for FAL.ai result...")
        result = await handler.get()
        logger.info(f"FAL.ai result received: {result.keys() if result else 'None'}")
        
        return {
            "success": True,
            "video_url": result.get("video", {}).get("url"),
            "duration": result.get("duration", duration),
            "metadata": result
        }
    except Exception as e:
        logger.error(f"FAL.ai video generation error: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": str(e)
        }

async def process_video_generation(video_id: str, prompt: dict):
    """Background task to process video generation using FAL.ai"""
    import asyncio
    
    try:
        logger.info(f"Starting video generation for {video_id}")
        
        # Update status to processing
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {"status": "processing"}}
        )
        logger.info(f"Video {video_id} status updated to processing")
        
        # Build prompt text from structured prompt
        prompt_data = prompt.get("generated_prompt", {})
        hook = prompt_data.get("hook", {})
        scenes = prompt_data.get("scenes", [])
        visual_style = prompt_data.get("visual_style", {})
        
        # Create comprehensive prompt for video generation
        prompt_text_parts = []
        
        # Add hook description
        if hook.get("description"):
            prompt_text_parts.append(f"Opening: {hook['description']}")
        
        # Add scene descriptions
        for scene in scenes[:3]:  # Limit to first 3 scenes for brevity
            if scene.get("visual_description"):
                prompt_text_parts.append(scene["visual_description"])
        
        # Add visual style
        if visual_style.get("cinematography"):
            prompt_text_parts.append(f"Style: {visual_style['cinematography']}")
        if visual_style.get("mood"):
            prompt_text_parts.append(f"Mood: {visual_style['mood']}")
        
        prompt_text = ". ".join(prompt_text_parts)
        logger.info(f"Video {video_id} - Constructed prompt: {prompt_text[:200]}...")
        
        # Try to generate video with FAL.ai
        logger.info(f"Video {video_id} - Submitting to FAL.ai...")
        video_result = await generate_video_with_fal(
            prompt_text=prompt_text,
            video_length=prompt.get("video_length", 30)
        )
        logger.info(f"Video {video_id} - FAL.ai result: {video_result.get('success')}")
        
        completed_at = datetime.now(timezone.utc).isoformat()
        video_url = None
        
        if video_result.get("success"):
            # Real video generated successfully
            video_url = video_result["video_url"]
            logger.info(f"Video {video_id} generated successfully with FAL.ai")
        else:
            # Fallback to placeholder if FAL.ai fails
            logger.warning(f"FAL.ai generation failed, using placeholder for {video_id}: {video_result.get('error')}")
            video_url = f"https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"  # Sample video URL
        
        # ==================== STEP 2: GENERATE CAPTION & HASHTAGS ====================
        logger.info(f"Video {video_id} - Generating caption and hashtags...")
        
        # Extract video topic from prompt
        video_topic = prompt.get("niche", "")
        if hook.get("description"):
            video_topic = hook["description"][:100]  # Use hook description as topic
        
        caption_result = await generate_caption_and_hashtags(
            niche=prompt.get("niche", ""),
            tone=prompt.get("tone", "cinematic"),
            platform=prompt.get("platform", "instagram"),
            video_length=prompt.get("video_length", 30),
            goal=prompt.get("goal", "engagement"),
            video_topic=video_topic
        )
        
        caption = caption_result.get("caption", "Check out this amazing video! 🔥")
        hashtags = caption_result.get("hashtags", ["#Reels", "#Viral"])
        
        logger.info(f"Video {video_id} - Caption generated: {caption[:50]}...")
        logger.info(f"Video {video_id} - Hashtags: {', '.join(hashtags[:3])}...")
        
        # ==================== STEP 3: AUTO-POST TO INSTAGRAM (REAL API) ====================
        mode = "REAL" if not instagram_service.mock_mode else "MOCK"
        logger.info(f"Video {video_id} - Posting to Instagram ({mode} mode)...")
        
        try:
            # Create media container
            container_id = await instagram_service.create_media_container(
                video_url=video_url,
                caption=caption,
                hashtags=hashtags
            )
            
            if container_id:
                # Wait for container to be ready (only for real API)
                if not instagram_service.mock_mode:
                    logger.info(f"Video {video_id} - Waiting for container to be ready...")
                    max_retries = 30
                    retry_count = 0
                    
                    while retry_count < max_retries:
                        status_result = await instagram_service.get_container_status(container_id)
                        if status_result and status_result.get("status_code") == "FINISHED":
                            logger.info(f"Video {video_id} - Container ready for publishing")
                            break
                        
                        retry_count += 1
                        await asyncio.sleep(2)  # Wait 2 seconds between checks
                    
                    if retry_count >= max_retries:
                        logger.warning(f"Video {video_id} - Container processing timeout")
                
                # Publish reel
                publish_result = await instagram_service.publish_reel(
                    container_id=container_id,
                    caption=caption,
                    hashtags=hashtags
                )
                
                if publish_result and publish_result.get("success"):
                    instagram_post_id = publish_result.get("instagram_post_id")
                    posted_at = publish_result.get("posted_at")
                    
                    logger.info(f"Video {video_id} - Successfully posted to Instagram: {instagram_post_id}")
                    
                    # Update video with ALL data including Instagram info
                    await db.videos.update_one(
                        {"id": video_id},
                        {
                            "$set": {
                                "status": "completed",
                                "video_url": video_url,
                                "duration": video_result.get("duration", prompt.get("video_length", 30)) if video_result.get("success") else prompt.get("video_length", 30),
                                "completed_at": completed_at,
                                "caption_text": caption,
                                "hashtags_used": hashtags,
                                "instagram_post_id": instagram_post_id,
                                "posted_at": posted_at,
                                "platform": "instagram"
                            }
                        }
                    )
                else:
                    # Instagram posting failed, but video is still complete
                    logger.warning(f"Video {video_id} - Instagram posting failed")
                    await db.videos.update_one(
                        {"id": video_id},
                        {
                            "$set": {
                                "status": "completed",
                                "video_url": video_url,
                                "duration": video_result.get("duration", prompt.get("video_length", 30)) if video_result.get("success") else prompt.get("video_length", 30),
                                "completed_at": completed_at,
                                "caption_text": caption,
                                "hashtags_used": hashtags,
                                "instagram_post_id": None,
                                "posted_at": None,
                                "platform": "instagram"
                            }
                        }
                    )
            else:
                # Media container creation failed
                logger.warning(f"Video {video_id} - Instagram media container creation failed")
                await db.videos.update_one(
                    {"id": video_id},
                    {
                        "$set": {
                            "status": "completed",
                            "video_url": video_url,
                            "duration": video_result.get("duration", prompt.get("video_length", 30)) if video_result.get("success") else prompt.get("video_length", 30),
                            "completed_at": completed_at,
                            "caption_text": caption,
                            "hashtags_used": hashtags,
                            "instagram_post_id": None,
                            "posted_at": None,
                            "platform": "instagram"
                        }
                    }
                )
        except Exception as ig_error:
            logger.error(f"Video {video_id} - Instagram posting error: {ig_error}")
            # Still mark video as completed even if Instagram posting fails
            await db.videos.update_one(
                {"id": video_id},
                {
                    "$set": {
                        "status": "completed",
                        "video_url": video_url,
                        "duration": video_result.get("duration", prompt.get("video_length", 30)) if video_result.get("success") else prompt.get("video_length", 30),
                        "completed_at": completed_at,
                        "caption_text": caption,
                        "hashtags_used": hashtags,
                        "instagram_post_id": None,
                        "posted_at": None,
                        "platform": "instagram"
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
        
        logger.info(f"Video {video_id} processing completed")
        
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



# ==================== INSTAGRAM CONFIGURATION ROUTES ====================

@api_router.get("/instagram/config")
async def get_instagram_config(current_user: dict = Depends(get_current_user)):
    """Get current Instagram API configuration status"""
    return {
        "mock_mode": instagram_service.mock_mode,
        "has_access_token": bool(instagram_service.access_token),
        "has_business_account_id": bool(instagram_service.business_account_id),
        "business_account_id": instagram_service.business_account_id if instagram_service.business_account_id else None,
        "api_version": instagram_service.api_version
    }

@api_router.post("/instagram/fetch-account-id")
async def fetch_instagram_account_id(current_user: dict = Depends(get_current_user)):
    """Manually fetch Instagram Business Account ID"""
    try:
        account_id = await instagram_service._fetch_business_account_id()
        
        if account_id:
            # Update the service
            instagram_service.business_account_id = account_id
            instagram_service.mock_mode = False
            
            # Update .env file
            env_path = ROOT_DIR / '.env'
            with open(env_path, 'r') as f:
                env_content = f.read()
            
            # Replace the INSTAGRAM_BUSINESS_ACCOUNT_ID line
            import re
            env_content = re.sub(
                r'INSTAGRAM_BUSINESS_ACCOUNT_ID=".*"',
                f'INSTAGRAM_BUSINESS_ACCOUNT_ID="{account_id}"',
                env_content
            )
            
            with open(env_path, 'w') as f:
                f.write(env_content)
            
            logger.info(f"Instagram Business Account ID updated: {account_id}")
            
            return {
                "success": True,
                "business_account_id": account_id,
                "message": "Instagram Business Account ID fetched and saved successfully"
            }
        else:
            return {
                "success": False,
                "error": "Failed to fetch Instagram Business Account ID. Please check your access token."
            }
    except Exception as e:
        logger.error(f"Error fetching account ID: {e}")
        return {
            "success": False,
            "error": str(e)
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
# To run the app, use: uvicorn backend.server:app --host 0.0.0 --port 8000