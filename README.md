# Chiron - AI-Powered Course Builder

<div align="center">

![Chiron Logo](https://img.shields.io/badge/Chiron-AI%20Course%20Builder-1A4D2E?style=for-the-badge&logo=bookopen&logoColor=white)

**Turn any topic into a complete course with AI-generated lessons, YouTube videos, and interactive quizzes.**

[Live Demo](https://your-demo-url.com) · [Report Bug](https://github.com/yourusername/chiron/issues) · [Request Feature](https://github.com/yourusername/chiron/issues)

</div>

---

## 📸 Screenshots

### Landing Page
*Clean, professional landing page with hero section and feature highlights*
<!-- Add your screenshot: docs/screenshots/landing.png -->

### Dashboard
*User dashboard showing courses and progress tracking*
<!-- Add your screenshot: docs/screenshots/dashboard.png -->

### Course Generator
*AI-powered course creation with topic input, difficulty selection, and lesson count*
<!-- Add your screenshot: docs/screenshots/generator.png -->

### Course View with YouTube Videos
*Full course view with embedded YouTube videos, lesson content, and quiz functionality*
<!-- Add your screenshot: docs/screenshots/course.png -->

---

## ✨ Features

- **🤖 AI-Powered Course Generation** - Enter any topic and Claude Sonnet 4.5 generates structured lessons with detailed content, code examples, and explanations
- **📺 YouTube Integration** - Each lesson automatically includes relevant educational videos from YouTube
- **📝 Interactive Quizzes** - AI-generated quiz questions with multiple choice options, scoring, and explanations
- **📊 Progress Tracking** - Track lesson completion and quiz scores across all courses
- **🔐 Google OAuth** - Secure authentication via Google login
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB |
| **AI** | Claude Sonnet 4.5 (Anthropic) |
| **Video** | YouTube Data API v3 |
| **Auth** | Google OAuth 2.0 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB
- YouTube Data API Key
- Anthropic API Key (or Emergent LLM Key)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chiron.git
   cd chiron
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   
   Create `backend/.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=chiron
   EMERGENT_LLM_KEY=your_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

   Create `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   yarn install
   ```

5. **Start the Application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   yarn start
   ```

6. **Open in Browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
chiron/
├── backend/
│   ├── server.py           # FastAPI application with all endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app with routing & auth context
│   │   ├── pages/
│   │   │   ├── Landing.js       # Landing page
│   │   │   ├── Dashboard.js     # User dashboard
│   │   │   ├── CourseGenerator.js  # Course creation form
│   │   │   ├── CourseView.js    # Course viewer with lessons
│   │   │   └── AuthCallback.js  # OAuth callback handler
│   │   ├── App.css        # Component styles
│   │   └── index.css      # Global styles with Tailwind
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # Node dependencies
├── docs/
│   └── screenshots/       # Application screenshots
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/auth/session` | Exchange OAuth session |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Logout user |
| `POST` | `/api/courses/generate` | Generate new course with AI |
| `GET` | `/api/courses` | Get user's courses |
| `GET` | `/api/courses/{id}` | Get specific course |
| `DELETE` | `/api/courses/{id}` | Delete course |
| `POST` | `/api/progress/update` | Update lesson progress |
| `GET` | `/api/progress/{id}` | Get course progress |

---

## 🎯 How It Works

1. **User enters a topic** - e.g., "Pointers in C++" or "Machine Learning basics"
2. **AI generates course structure** - Claude creates lessons, content, and quiz questions
3. **YouTube videos are matched** - Relevant educational videos are automatically found
4. **Course is saved** - User can access their course anytime
5. **Progress is tracked** - Lesson completion and quiz scores are saved

---

## 🎨 Design Philosophy

Chiron follows an "Intellectual Explorer" design aesthetic:
- **Swiss precision** meets **organic warmth**
- Deep Forest Green (#1A4D2E) as primary color
- Clean, high-contrast typography with Space Grotesk
- Minimal shadows, maximum clarity

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [Anthropic Claude](https://anthropic.com) for AI capabilities
- [YouTube Data API](https://developers.google.com/youtube/v3) for video integration
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations

---

<div align="center">

*Named after Chiron, the wise centaur of Greek mythology who taught heroes like Achilles and Hercules*

</div>
