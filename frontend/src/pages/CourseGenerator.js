import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  BookOpen, Sparkles, ArrowLeft, Loader2, 
  GraduationCap, User, Briefcase 
} from 'lucide-react';
import '../App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CourseGenerator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [numLessons, setNumLessons] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const difficulties = [
    { value: 'beginner', label: 'Beginner', icon: <GraduationCap className="w-5 h-5" />, desc: 'New to the topic' },
    { value: 'intermediate', label: 'Intermediate', icon: <User className="w-5 h-5" />, desc: 'Some prior knowledge' },
    { value: 'advanced', label: 'Advanced', icon: <Briefcase className="w-5 h-5" />, desc: 'Deep dive required' }
  ];

  const examplePrompts = [
    'Pointers in C++',
    'Machine Learning basics with Python',
    'React hooks and state management',
    'Financial accounting fundamentals',
    'Digital marketing strategies',
    'Data structures and algorithms'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a topic for your course');
      return;
    }

    setGenerating(true);
    setProgress('Generating course content with AI...');

    try {
      const response = await fetch(`${API_URL}/api/courses/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          difficulty,
          num_lessons: numLessons
        })
      });

      setProgress('Finding relevant YouTube videos...');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate course');
      }

      const course = await response.json();
      toast.success('Course generated successfully!');
      navigate(`/course/${course.course_id}`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate course');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-base-light" data-testid="course-generator-page">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-primary">CourseForge</span>
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl font-bold mb-4">
              Create Your Course
            </h1>
            <p className="text-gray-600 text-lg">
              Describe what you want to learn, and AI will generate a complete course for you.
            </p>
          </div>

          <div className="card">
            {/* Topic Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to learn?
              </label>
              <textarea
                data-testid="course-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Pointers in C++, Machine Learning basics, React hooks..."
                className="input min-h-[120px] resize-none"
                disabled={generating}
              />
              
              {/* Example prompts */}
              <div className="mt-3 flex flex-wrap gap-2">
                {examplePrompts.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary transition-colors"
                    disabled={generating}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    data-testid={`difficulty-${d.value}`}
                    onClick={() => setDifficulty(d.value)}
                    disabled={generating}
                    className={`p-4 border transition-all text-left ${
                      difficulty === d.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <div className={`mb-2 ${difficulty === d.value ? 'text-primary' : 'text-gray-400'}`}>
                      {d.icon}
                    </div>
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs text-gray-500">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Lessons */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Lessons: <span className="text-primary font-bold">{numLessons}</span>
              </label>
              <input
                data-testid="num-lessons-slider"
                type="range"
                min="2"
                max="8"
                value={numLessons}
                onChange={(e) => setNumLessons(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={generating}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2</span>
                <span>8</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              data-testid="generate-course-btn"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {progress || 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Course
                </>
              )}
            </button>

            {generating && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-gray-500 mt-4"
              >
                This may take 30-60 seconds. AI is creating your lessons and finding relevant videos...
              </motion.p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
