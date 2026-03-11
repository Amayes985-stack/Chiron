import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { Sparkles, BookOpen, Video, Brain, ChevronRight, CheckCircle } from 'lucide-react';
import '../App.css';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      login();
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Generation',
      description: 'Enter any topic and watch as AI creates a structured, multi-lesson course instantly.'
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Relevant YouTube Videos',
      description: 'Each lesson includes curated educational videos from YouTube automatically matched to the content.'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Interactive Quizzes',
      description: 'Test your understanding with AI-generated quizzes after each lesson.'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Progress Tracking',
      description: 'Track your learning journey with detailed progress indicators across all courses.'
    }
  ];

  const audiences = [
    { name: 'School Students', desc: 'Master any subject from math to science' },
    { name: 'College Students', desc: 'Ace programming, engineering, and more' },
    { name: 'Professionals', desc: 'Upskill with cutting-edge topics' }
  ];

  return (
    <div className="min-h-screen bg-base-light">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-primary">Chiron</span>
          </div>
          <button
            data-testid="header-get-started-btn"
            onClick={handleGetStarted}
            className="btn-primary flex items-center gap-2"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium text-sm mb-6">
              AI-Powered Learning
            </span>
            <h1 className="font-heading text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Any Topic Into a <span className="text-primary">Complete Course</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Simply describe what you want to learn, and our AI creates a structured course with 
              lessons, YouTube videos, and quizzes. Perfect for students and professionals.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                data-testid="hero-get-started-btn"
                onClick={handleGetStarted}
                className="btn-primary text-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Create Your Course
              </button>
              <button
                data-testid="hero-learn-more-btn"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-lg"
              >
                Learn More
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-video bg-primary/5 border border-border overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1761492190275-129cf71ff124?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxzdHVkZW50JTIwc3R1ZHlpbmclMjBsaWJyYXJ5JTIwYWVzdGhldGljfGVufDB8fHx8MTc3MzE4OTU5M3ww&ixlib=rb-4.1.0&q=85"
                alt="Student studying"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white p-4 border border-border shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-heading font-semibold">4+ Lessons</p>
                  <p className="text-sm text-gray-500">Generated in seconds</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chiron combines AI content generation with curated YouTube videos 
              to create comprehensive learning experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-20 bg-base-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">Built For Everyone</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you're preparing for exams or learning new skills, Chiron adapts to your level.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card text-center"
              >
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">{audience.name}</h3>
                <p className="text-gray-600">{audience.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-primary-light text-lg mb-8 opacity-90">
            Create your first AI-generated course in under a minute.
          </p>
          <button
            data-testid="cta-get-started-btn"
            onClick={handleGetStarted}
            className="bg-white text-primary px-8 py-4 font-semibold text-lg transition-all hover:bg-base-light flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-white">Chiron</span>
            </div>
            <p className="text-sm">© 2025 Chiron. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
