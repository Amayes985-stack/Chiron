import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  BookOpen, Plus, LogOut, User, Clock, CheckCircle, 
  Trash2, PlayCircle, ChevronRight, Loader2 
} from 'lucide-react';
import '../App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        toast.error('Failed to load courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    setDeleting(courseId);
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setCourses(courses.filter(c => c.course_id !== courseId));
        toast.success('Course deleted');
      } else {
        toast.error('Failed to delete course');
      }
    } catch (error) {
      toast.error('Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalProgress = courses.length > 0
    ? courses.reduce((acc, c) => acc + (c.progress?.percent_complete || 0), 0) / courses.length
    : 0;

  return (
    <div className="min-h-screen bg-base-light" data-testid="dashboard-page">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-primary">Chiron</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="text-sm font-medium hidden md:block">{user?.name}</span>
            </div>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome & Stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 card"
          >
            <h1 className="font-heading text-2xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 mb-6">
              {courses.length === 0 
                ? "You haven't created any courses yet. Start by generating your first AI-powered course!"
                : `You have ${courses.length} course${courses.length !== 1 ? 's' : ''} in progress.`
              }
            </p>
            <button
              data-testid="create-course-btn"
              onClick={() => navigate('/generate')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Course
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="font-heading text-lg font-semibold mb-4">Overall Progress</h3>
            <div className="text-4xl font-bold text-primary mb-2">
              {Math.round(totalProgress)}%
            </div>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: `${totalProgress}%` }}></div>
            </div>
            <p className="text-sm text-gray-500">
              {courses.filter(c => (c.progress?.percent_complete || 0) === 100).length} of {courses.length} completed
            </p>
          </motion.div>
        </div>

        {/* Courses List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Your Courses</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-16"
            >
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold text-gray-700 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first course by entering a topic you want to learn.
              </p>
              <button
                data-testid="empty-create-course-btn"
                onClick={() => navigate('/generate')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card group cursor-pointer"
                  data-testid={`course-card-${course.course_id}`}
                  onClick={() => navigate(`/course/${course.course_id}`)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 mb-4 overflow-hidden relative">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-heading font-semibold line-clamp-2">{course.title}</h3>
                    <button
                      data-testid={`delete-course-${course.course_id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(course.course_id);
                      }}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={deleting === course.course_id}
                    >
                      {deleting === course.course_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description}</p>

                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.lessons?.length || 0} lessons
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${course.progress?.percent_complete || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(course.progress?.percent_complete || 0)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
