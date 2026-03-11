# CourseForge - AI Course Builder PRD

## Original Problem Statement
Build an AI Course Builder - a "prompt to course" platform where users input a topic (like "pointers in C++") and AI automatically generates a multi-lesson course with embedded YouTube videos, quizzes, and questions. Target audience: School students, College students, and Professional learners.

## User Choices
- **AI Provider**: Claude Sonnet 4.5 (via Emergent LLM)
- **Video Integration**: YouTube Data API v3
- **Authentication**: Google OAuth (Emergent-managed)
- **Features**: Progress tracking, interactive quizzes

## Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via emergentintegrations
- **Video**: YouTube Data API v3
- **Auth**: Emergent OAuth

### Key Files
```
/app
├── backend/
│   ├── server.py          # FastAPI server with all endpoints
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main app with routing & auth
│   │   ├── pages/
│   │   │   ├── Landing.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CourseGenerator.js
│   │   │   └── CourseView.js
│   │   └── index.css     # Global styles
│   └── .env              # Frontend environment
└── design_guidelines.json # UI/UX design system
```

## Core Requirements (Static)
1. ✅ Prompt-to-Course generation using AI
2. ✅ YouTube video integration for each lesson
3. ✅ Quiz generation with multiple choice questions
4. ✅ Progress tracking per user
5. ✅ Google OAuth authentication
6. ✅ Responsive design for all audiences

## What's Been Implemented (2026-03-11)

### MVP Features
- [x] Landing page with hero, features, CTA sections
- [x] Google OAuth login via Emergent Auth
- [x] Dashboard showing user's courses and progress
- [x] Course generator with prompt, difficulty, lesson count
- [x] AI course generation using Claude Sonnet 4.5
- [x] YouTube video search and embedding
- [x] Lesson content display with code examples
- [x] Interactive quiz modal with scoring
- [x] Progress tracking (lesson completion, quiz scores)
- [x] Logout functionality

### Technical Achievements
- Retry logic for AI API calls (handles 502 errors)
- MongoDB integration with proper projections
- Session-based authentication with cookies
- Responsive UI with Tailwind CSS
- Framer Motion animations

## User Personas

### Student (K-12)
- Needs quick study guides on school subjects
- Prefers beginner-level content
- Uses quizzes for self-assessment

### College Student
- Learns programming, engineering topics
- Intermediate difficulty preferred
- Values YouTube video integration

### Professional
- Upskilling on new technologies
- Advanced content needed
- Progress tracking for certificates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/auth/session | Exchange OAuth session |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout user |
| POST | /api/courses/generate | Generate new course |
| GET | /api/courses | Get user's courses |
| GET | /api/courses/{id} | Get specific course |
| DELETE | /api/courses/{id} | Delete course |
| POST | /api/progress/update | Update lesson progress |
| GET | /api/progress/{id} | Get course progress |

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Course generation
- [x] Video integration
- [x] Quiz system
- [x] Authentication

### P1 - High Priority (Future)
- [ ] Course sharing/export
- [ ] Certificate generation
- [ ] Search/filter courses
- [ ] Course categories

### P2 - Nice to Have
- [ ] Dark mode
- [ ] Mobile app
- [ ] Collaborative courses
- [ ] AI-powered tutoring chat

## Next Tasks
1. Add course categories/tags
2. Implement course search
3. Add certificate PDF generation
4. Create shareable course links
5. Add more quiz question types (true/false, fill-in-blank)

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_course_builder
EMERGENT_LLM_KEY=sk-emergent-xxx
YOUTUBE_API_KEY=AIzaSyXxx
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://xxx.preview.emergentagent.com
```

## Testing
- Test session token: Create via MongoDB using auth_testing.md
- All protected routes require valid session cookie
- AI generation has 3 retry attempts with exponential backoff
