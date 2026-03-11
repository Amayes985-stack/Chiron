"""
AI Course Builder Backend - FastAPI Server
"""
import os
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "ai_course_builder")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# MongoDB client
client: AsyncIOMotorClient = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.courses.create_index("user_id")
    await db.progress.create_index([("user_id", 1), ("course_id", 1)])
    yield
    client.close()

app = FastAPI(title="AI Course Builder API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class CourseGenerateRequest(BaseModel):
    prompt: str
    difficulty: str = "intermediate"  # beginner, intermediate, advanced
    num_lessons: int = Field(default=4, ge=2, le=8)

class Lesson(BaseModel):
    lesson_id: str
    title: str
    description: str
    content: str
    video_id: Optional[str] = None
    video_title: Optional[str] = None
    video_thumbnail: Optional[str] = None
    quiz: List[dict] = []
    order: int

class Course(BaseModel):
    course_id: str
    user_id: str
    title: str
    description: str
    difficulty: str
    lessons: List[Lesson]
    created_at: datetime
    thumbnail: Optional[str] = None

class ProgressUpdate(BaseModel):
    course_id: str
    lesson_id: str
    completed: bool = False
    quiz_score: Optional[int] = None

class Progress(BaseModel):
    user_id: str
    course_id: str
    completed_lessons: List[str] = []
    quiz_scores: dict = {}
    last_accessed: datetime
    percent_complete: float = 0.0

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ENDPOINTS ====================

@app.get("/api/auth/session")
async def exchange_session(session_id: str, response: Response):
    """Exchange session_id from OAuth for session_token"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        data = resp.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        })
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== YOUTUBE HELPERS ====================

def get_youtube_service():
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, cache_discovery=False)

async def search_youtube_videos(query: str, max_results: int = 3) -> List[dict]:
    """Search YouTube for educational videos"""
    try:
        youtube = get_youtube_service()
        search_query = f"{query} tutorial educational"
        
        request = youtube.search().list(
            part="snippet",
            q=search_query,
            type="video",
            maxResults=max_results,
            videoDuration="medium",
            relevanceLanguage="en",
            safeSearch="strict"
        )
        response = request.execute()
        
        videos = []
        for item in response.get("items", []):
            videos.append({
                "video_id": item["id"]["videoId"],
                "title": item["snippet"]["title"],
                "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                "channel": item["snippet"]["channelTitle"]
            })
        return videos
    except HttpError as e:
        print(f"YouTube API error: {e}")
        return []
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return []

# ==================== AI COURSE GENERATION ====================

async def generate_course_content(prompt: str, difficulty: str, num_lessons: int) -> dict:
    """Generate course content using Claude Sonnet 4.5"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"course_{uuid.uuid4().hex[:8]}",
        system_message="""You are an expert educational course creator. Create structured, engaging courses with clear learning objectives.
        
IMPORTANT: You must respond ONLY with valid JSON, no markdown, no code blocks, just pure JSON.
The JSON must have this exact structure:
{
    "title": "Course Title",
    "description": "Course description",
    "lessons": [
        {
            "title": "Lesson Title",
            "description": "What students will learn",
            "content": "Detailed lesson content with examples and explanations (at least 300 words)",
            "search_query": "YouTube search query for relevant video",
            "quiz": [
                {
                    "question": "Quiz question?",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "explanation": "Why this is correct"
                }
            ]
        }
    ]
}"""
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(
        text=f"""Create a {difficulty} level course about: {prompt}

Requirements:
- Generate exactly {num_lessons} lessons
- Each lesson should build on the previous one
- Include 2-3 quiz questions per lesson with 4 options each
- Make content appropriate for the {difficulty} level
- Include practical examples and clear explanations
- For search_query, provide a specific YouTube search term to find relevant educational videos

Respond with ONLY valid JSON, no additional text or formatting."""
    )
    
    response = await chat.send_message(user_message)
    
    # Clean response - remove any markdown formatting
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    import json
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Response: {cleaned[:500]}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

# ==================== COURSE ENDPOINTS ====================

@app.post("/api/courses/generate")
async def generate_course(
    req: CourseGenerateRequest,
    user: User = Depends(get_current_user)
):
    """Generate a new course using AI"""
    # Generate course content
    course_data = await generate_course_content(req.prompt, req.difficulty, req.num_lessons)
    
    # Create lessons with YouTube videos
    lessons = []
    for idx, lesson_data in enumerate(course_data.get("lessons", [])):
        lesson_id = f"lesson_{uuid.uuid4().hex[:8]}"
        
        # Search for YouTube video
        videos = await search_youtube_videos(lesson_data.get("search_query", lesson_data["title"]))
        video = videos[0] if videos else None
        
        lesson = Lesson(
            lesson_id=lesson_id,
            title=lesson_data["title"],
            description=lesson_data.get("description", ""),
            content=lesson_data.get("content", ""),
            video_id=video["video_id"] if video else None,
            video_title=video["title"] if video else None,
            video_thumbnail=video["thumbnail"] if video else None,
            quiz=lesson_data.get("quiz", []),
            order=idx
        )
        lessons.append(lesson)
    
    # Create course
    course_id = f"course_{uuid.uuid4().hex[:8]}"
    course = Course(
        course_id=course_id,
        user_id=user.user_id,
        title=course_data.get("title", req.prompt),
        description=course_data.get("description", ""),
        difficulty=req.difficulty,
        lessons=lessons,
        created_at=datetime.now(timezone.utc),
        thumbnail=lessons[0].video_thumbnail if lessons and lessons[0].video_thumbnail else None
    )
    
    # Save to database
    await db.courses.insert_one(course.model_dump())
    
    # Initialize progress
    await db.progress.insert_one({
        "user_id": user.user_id,
        "course_id": course_id,
        "completed_lessons": [],
        "quiz_scores": {},
        "last_accessed": datetime.now(timezone.utc),
        "percent_complete": 0.0
    })
    
    return course.model_dump()

@app.get("/api/courses")
async def get_user_courses(user: User = Depends(get_current_user)):
    """Get all courses for the current user"""
    cursor = db.courses.find({"user_id": user.user_id}, {"_id": 0})
    courses = await cursor.to_list(length=100)
    
    # Get progress for each course
    for course in courses:
        progress = await db.progress.find_one(
            {"user_id": user.user_id, "course_id": course["course_id"]},
            {"_id": 0}
        )
        course["progress"] = progress
    
    return courses

@app.get("/api/courses/{course_id}")
async def get_course(course_id: str, user: User = Depends(get_current_user)):
    """Get a specific course"""
    course = await db.courses.find_one(
        {"course_id": course_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    progress = await db.progress.find_one(
        {"user_id": user.user_id, "course_id": course_id},
        {"_id": 0}
    )
    course["progress"] = progress
    
    return course

@app.delete("/api/courses/{course_id}")
async def delete_course(course_id: str, user: User = Depends(get_current_user)):
    """Delete a course"""
    result = await db.courses.delete_one({"course_id": course_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    await db.progress.delete_one({"user_id": user.user_id, "course_id": course_id})
    return {"message": "Course deleted"}

# ==================== PROGRESS ENDPOINTS ====================

@app.post("/api/progress/update")
async def update_progress(
    update: ProgressUpdate,
    user: User = Depends(get_current_user)
):
    """Update lesson progress"""
    # Get course to calculate percentage
    course = await db.courses.find_one(
        {"course_id": update.course_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    total_lessons = len(course.get("lessons", []))
    
    # Get current progress
    progress = await db.progress.find_one(
        {"user_id": user.user_id, "course_id": update.course_id}
    )
    
    if not progress:
        progress = {
            "user_id": user.user_id,
            "course_id": update.course_id,
            "completed_lessons": [],
            "quiz_scores": {},
            "last_accessed": datetime.now(timezone.utc),
            "percent_complete": 0.0
        }
    
    # Update completed lessons
    completed = progress.get("completed_lessons", [])
    if update.completed and update.lesson_id not in completed:
        completed.append(update.lesson_id)
    elif not update.completed and update.lesson_id in completed:
        completed.remove(update.lesson_id)
    
    # Update quiz scores
    quiz_scores = progress.get("quiz_scores", {})
    if update.quiz_score is not None:
        quiz_scores[update.lesson_id] = update.quiz_score
    
    # Calculate percentage
    percent_complete = (len(completed) / total_lessons * 100) if total_lessons > 0 else 0
    
    # Update database
    await db.progress.update_one(
        {"user_id": user.user_id, "course_id": update.course_id},
        {"$set": {
            "completed_lessons": completed,
            "quiz_scores": quiz_scores,
            "last_accessed": datetime.now(timezone.utc),
            "percent_complete": percent_complete
        }},
        upsert=True
    )
    
    return {
        "completed_lessons": completed,
        "quiz_scores": quiz_scores,
        "percent_complete": percent_complete
    }

@app.get("/api/progress/{course_id}")
async def get_progress(course_id: str, user: User = Depends(get_current_user)):
    """Get progress for a specific course"""
    progress = await db.progress.find_one(
        {"user_id": user.user_id, "course_id": course_id},
        {"_id": 0}
    )
    if not progress:
        return {
            "user_id": user.user_id,
            "course_id": course_id,
            "completed_lessons": [],
            "quiz_scores": {},
            "percent_complete": 0.0
        }
    return progress

@app.get("/api/progress")
async def get_all_progress(user: User = Depends(get_current_user)):
    """Get all progress for the current user"""
    cursor = db.progress.find({"user_id": user.user_id}, {"_id": 0})
    progress_list = await cursor.to_list(length=100)
    return progress_list

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
