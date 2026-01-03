import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useNavigationHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt/Option + Left Arrow = Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      }
      // Alt/Option + Right Arrow = Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);

  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);

  return { goBack, goForward };
}
