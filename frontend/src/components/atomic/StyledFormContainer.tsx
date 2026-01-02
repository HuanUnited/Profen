import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface StyledFormContainerProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

const StyledWrapper = styled.div`
  .form-container {
    background: linear-gradient(#212121, #212121) padding-box,
                linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
    border: 2px solid transparent;
    padding: 32px 24px;
    font-size: 14px;
    font-family: 'JetBrains Mono', monospace;
    color: #cdd6f4;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    border-radius: 16px;
    background-size: 200% 100%;
    animation: gradient 5s ease infinite;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .form-container button:active {
    scale: 0.95;
  }

  .form-container .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-container .form-group label {
    display: block;
    margin-bottom: 4px;
    color: #a6adc8;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-container .form-group input,
  .form-container .form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    color: #cdd6f4;
    font-family: inherit;
    background-color: rgba(255,255,255,0.03);
    border: 1px solid #414141;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }

  .form-container .form-group input::placeholder {
    opacity: 0.6;
    color: #717171;
  }

  .form-container .form-group input:focus,
  .form-container .form-group textarea:focus {
    outline: none;
    border-color: #e81cff;
    box-shadow: 0 0 0 3px rgba(232, 28, 255, 0.1);
    background-color: rgba(255,255,255,0.05);
  }

  .form-container .form-group textarea {
    resize: none;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.5;
  }

  .form-container .form-submit-btn {
    align-self: flex-start;
    font-family: inherit;
    color: #717171;
    font-weight: 600;
    width: 40%;
    background: rgba(49, 49, 49, 0.8);
    border: 1px solid #414141;
    padding: 12px 16px;
    font-size: inherit;
    cursor: pointer;
    border-radius: 6px;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }

  .form-container .form-submit-btn:hover:not(:disabled) {
    background-color: rgba(255,255,255,0.9);
    border-color: rgba(255,255,255,0.9);
    color: #1e1e2e;
    transform: translateY(-1px);
  }

  .form-container .form-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function StyledFormContainer({
  children,
  className = "",
  onSubmit
}: StyledFormContainerProps) {
  return (
    <StyledWrapper className={className}>
      <div className="form-container">
        <form className="form space-y-5" onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </StyledWrapper>
  );
}
