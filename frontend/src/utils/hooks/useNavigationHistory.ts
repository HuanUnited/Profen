// frontend/src/hooks/useNavigationHistory.ts
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useNavigationHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [historyIndex, setHistoryIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);

  useEffect(() => {
    // each time location changes, move index forward and clamp max
    setHistoryIndex((prev) => {
      const next = prev + 1;
      setMaxIndex((oldMax) => Math.max(oldMax, next));
      return next;
    });
  }, [location]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
      if (e.altKey && e.key === "ArrowRight" && historyIndex < maxIndex) {
        e.preventDefault();
        navigate(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, historyIndex, maxIndex]);

  const goBack = () => navigate(-1);
  const goForward = () => {
    if (historyIndex < maxIndex) navigate(1);
  };

  const canGoForward = historyIndex < maxIndex;

  return { goBack, goForward, canGoForward };
}
