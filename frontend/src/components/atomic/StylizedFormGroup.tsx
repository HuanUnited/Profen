import { ReactNode } from 'react';

interface StyledFormGroupProps {
  children: ReactNode;
  className?: string;
}

export default function StyledFormGroup({ children, className = "" }: StyledFormGroupProps) {
  return (
    <div className={`form-group ${className}`}>
      {children}
    </div>
  );
}