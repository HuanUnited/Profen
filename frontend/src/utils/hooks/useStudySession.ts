import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GetNodeWithCard, ReviewCard, GetSchedulingInfo } from '../../wailsjs/go/app/App';
import useToast from './useToast';

export default function useStudySession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Queue State
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isQueueLoaded, setIsQueueLoaded] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  // Current Card State
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [intervals, setIntervals] = useState<{ [key: number]: string }>({});

  // 1. Initialize Queue from URL
  useEffect(() => {
    const queueParam = searchParams.get('queue');
    if (queueParam) {
      const ids = queueParam.split(',');
      setQueue(ids);
      setIsQueueLoaded(true);
    } else {
      // No queue? Redirect back
      navigate('/');
    }
  }, [searchParams, navigate]);

  // 2. Fetch Current Node
  const currentNodeId = queue[currentIndex];
  
  const { data: node, isLoading, refetch } = useQuery({
    queryKey: ['studyNode', currentNodeId],
    queryFn: () => GetNodeWithCard(currentNodeId),
    enabled: !!currentNodeId,
    staleTime: 0, // Always fetch fresh FSRS state
  });

  // 3. Fetch Scheduling Intervals (when node loads)
  useEffect(() => {
    if (currentNodeId) {
      GetSchedulingInfo(currentNodeId).then(setIntervals).catch(console.error);
      setStartTime(Date.now()); // Reset timer
      setIsAnswerShown(false);  // Reset view
    }
  }, [currentNodeId]);

  // 4. Handle Grading
  const handleGrade = useCallback(async (grade: number) => {
    if (!node) return;

    const duration = Date.now() - startTime;
    
    try {
      // Optimistic Update: Move to next immediately
      await ReviewCard(node.id, grade, duration, "");
      
      // Update stats
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: grade > 1 ? prev.correct + 1 : prev.correct
      }));

      // Next card
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // End of Session
        toast.success("Session Complete!");
        const returnPath = searchParams.get('returnTo') || '/';
        navigate(returnPath);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save review");
    }
  }, [node, startTime, currentIndex, queue.length, navigate, searchParams, toast]);

  return {
    node,
    isLoading: isLoading || !isQueueLoaded,
    progress: {
      current: currentIndex + 1,
      total: queue.length,
      stats: sessionStats
    },
    state: {
      isAnswerShown,
      intervals
    },
    actions: {
      showAnswer: () => setIsAnswerShown(true),
      grade: handleGrade,
      exit: () => navigate(searchParams.get('returnTo') || '/')
    }
  };
}