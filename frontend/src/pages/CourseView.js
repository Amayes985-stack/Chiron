import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  BookOpen, ArrowLeft, ChevronRight, PlayCircle, 
  CheckCircle, Circle, Loader2, X, RefreshCw
} from 'lucide-react';
import '../App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Course not found');
      }
      const data = await response.json();
      setCourse(data);
      // Set first lesson as active by default
      if (data.lessons?.length > 0) {
        setActiveLesson(data.lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (lessonId, completed, score = null) => {
    try {
      const response = await fetch(`${API_URL}/api/progress/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          completed,
          quiz_score: score
        })
      });
      
      if (response.ok) {
        const progressData = await response.json();
        setCourse(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            ...progressData
          }
        }));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleLessonComplete = async () => {
    if (!activeLesson) return;
    await updateProgress(activeLesson.lesson_id, true);
    toast.success('Lesson marked as complete!');
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson?.quiz) return;
    
    let correct = 0;
    activeLesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correct++;
      }
    });
    
    const score = Math.round((correct / activeLesson.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Update progress with quiz score
    await updateProgress(activeLesson.lesson_id, true, score);
    
    if (score >= 70) {
      toast.success(`Great job! You scored ${score}%`);
    } else {
      toast.info(`You scored ${score}%. Review the lesson and try again!`);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const isLessonCompleted = (lessonId) => {
    return course?.progress?.completed_lessons?.includes(lessonId);
  };

  const getLessonQuizScore = (lessonId) => {
    return course?.progress?.quiz_scores?.[lessonId];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-light" data-testid="course-view-page">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-primary">Chiron</span>
          </Link>
          
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-sm font-medium ${
              course.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
              course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {course.difficulty}
            </span>
            <span className="text-sm text-gray-500">
              {course.lessons?.length} lessons
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(course.progress?.percent_complete || 0)}% complete
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson && (
              <>
                {/* Video Player */}
                {activeLesson.video_id && (
                  <motion.div
                    key={activeLesson.lesson_id + '-video'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card p-0 overflow-hidden"
                  >
                    <div className="video-container">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeLesson.video_id}`}
                        title={activeLesson.video_title || 'Lesson Video'}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="lesson-video"
                      ></iframe>
                    </div>
                    {activeLesson.video_title && (
                      <div className="p-4 border-t border-border">
                        <p className="text-sm text-gray-500">Video: {activeLesson.video_title}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Lesson Content */}
                <motion.div
                  key={activeLesson.lesson_id + '-content'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">{activeLesson.title}</h2>
                      <p className="text-gray-600">{activeLesson.description}</p>
                    </div>
                    {isLessonCompleted(activeLesson.lesson_id) && (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="prose prose-gray max-w-none">
                    {activeLesson.content.split('\n').map((paragraph, idx) => (
                      paragraph.trim() && (
                        <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      )
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4">
                    {!isLessonCompleted(activeLesson.lesson_id) && (
                      <button
                        data-testid="mark-complete-btn"
                        onClick={handleLessonComplete}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Complete
                      </button>
                    )}
                    
                    {activeLesson.quiz?.length > 0 && (
                      <button
                        data-testid="take-quiz-btn"
                        onClick={() => {
                          resetQuiz();
                          setShowQuiz(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        Take Quiz ({activeLesson.quiz.length} questions)
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Sidebar - Lesson List */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-4">Course Content</h3>
              
              {/* Progress bar */}
              <div className="mb-4">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${course.progress?.percent_complete || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {course.progress?.completed_lessons?.length || 0} of {course.lessons?.length} completed
                </p>
              </div>

              <div className="space-y-2">
                {course.lessons?.map((lesson, idx) => {
                  const isActive = activeLesson?.lesson_id === lesson.lesson_id;
                  const isCompleted = isLessonCompleted(lesson.lesson_id);
                  const score = getLessonQuizScore(lesson.lesson_id);
                  
                  return (
                    <button
                      key={lesson.lesson_id}
                      data-testid={`lesson-item-${lesson.lesson_id}`}
                      onClick={() => {
                        setActiveLesson(lesson);
                        setShowQuiz(false);
                        resetQuiz();
                      }}
                      className={`w-full p-3 text-left border transition-all ${
                        isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isActive ? 'text-primary' : ''}`}>
                            {idx + 1}. {lesson.title}
                          </p>
                          {score !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              Quiz: {score}%
                            </p>
                          )}
                        </div>
                        {lesson.video_id && (
                          <PlayCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && activeLesson?.quiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuiz(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="quiz-modal"
            >
              <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold">
                  Quiz: {activeLesson.title}
                </h3>
                <button
                  data-testid="close-quiz-btn"
                  onClick={() => setShowQuiz(false)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {quizSubmitted && quizScore !== null && (
                  <div className={`p-4 ${quizScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
                    <p className="font-semibold text-lg">
                      Your Score: {quizScore}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {quizScore >= 70 
                        ? 'Great job! You passed the quiz.' 
                        : 'Review the lesson and try again to improve your score.'}
                    </p>
                  </div>
                )}

                {activeLesson.quiz.map((question, qIdx) => (
                  <div key={qIdx} className="space-y-3" data-testid={`quiz-question-${qIdx}`}>
                    <p className="font-medium">
                      {qIdx + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIdx) => {
                        const isSelected = quizAnswers[qIdx] === oIdx;
                        const isCorrect = question.correct === oIdx;
                        
                        let optionClass = 'quiz-option';
                        if (quizSubmitted) {
                          if (isCorrect) optionClass += ' correct';
                          else if (isSelected && !isCorrect) optionClass += ' incorrect';
                        } else if (isSelected) {
                          optionClass += ' selected';
                        }
                        
                        return (
                          <button
                            key={oIdx}
                            data-testid={`quiz-option-${qIdx}-${oIdx}`}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx });
                              }
                            }}
                            disabled={quizSubmitted}
                            className={`${optionClass} w-full`}
                          >
                            <span className="font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && question.explanation && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-border flex gap-4">
                  {!quizSubmitted ? (
                    <button
                      data-testid="submit-quiz-btn"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length !== activeLesson.quiz.length}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      data-testid="retry-quiz-btn"
                      onClick={resetQuiz}
                      className="btn-secondary flex items-center justify-center gap-2 flex-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
