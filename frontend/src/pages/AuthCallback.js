import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double-processing under StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Authentication failed');
          navigate('/', { replace: true });
          return;
        }

        // Exchange session_id for session_token
        const response = await fetch(`${API_URL}/api/auth/session?session_id=${sessionId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const userData = await response.json();
        setUser(userData);
        toast.success(`Welcome, ${userData.name}!`);
        
        // Navigate to dashboard with user data
        navigate('/dashboard', { replace: true, state: { user: userData } });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-base-light flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-text-secondary font-body">Completing sign in...</p>
      </div>
    </div>
  );
}
