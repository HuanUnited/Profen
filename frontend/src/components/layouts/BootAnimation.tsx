import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const BootWrapper = styled.div<{ $fadeOut: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0a0a0f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${props => props.$fadeOut ? fadeOut : fadeIn} 0.5s ease-in-out;

  .logo {
    font-size: 4rem;
    font-weight: 900;
    background: linear-gradient(135deg, #e81cff, #40c9ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 2rem;
    animation: ${pulse} 2s ease-in-out infinite;
  }

  .loading-bar {
    width: 300px;
    height: 4px;
    background: #1a1b26;
    border-radius: 2px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
  }

  .loading-progress {
    position: absolute;
    height: 100%;
    background: linear-gradient(90deg, #e81cff, #40c9ff);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .hint {
    font-size: 0.75rem;
    color: #6c7086;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 1rem;
    animation: ${pulse} 1.5s ease-in-out infinite;
  }
`;

interface BootAnimationProps {
  onComplete: () => void;
}

export default function BootAnimation({ onComplete }: BootAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        skip();
      }
    };

    const skip = () => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    };

    window.addEventListener('keydown', handleKeyPress);

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          skip();
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <BootWrapper $fadeOut={fadeOut}>
      <div className="logo">PROFEN</div>
      <div className="loading-bar">
        <div className="loading-progress" style={{ width: `${progress}%` }} />
      </div>
      <div className="hint">Press SPACEBAR to skip</div>
    </BootWrapper>
  );
}
