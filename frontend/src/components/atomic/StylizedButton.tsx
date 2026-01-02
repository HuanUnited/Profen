import { ReactNode } from 'react';
import clsx from 'clsx';

interface StyledButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function StyledButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  className = "",
  disabled = false
}: StyledButtonProps) {

  // Explicit mapping fixes the "Property does not exist" error
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    // Primary: Gradient like StyledFormTemplate
    primary: "bg-gradient-to-r from-[#e81cff] to-[#40c9ff] text-white border-transparent shadow-purple-500/25 hover:shadow-purple-500/40 border-0",
    // Secondary: Glassmorphism
    secondary: "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 border",
    // Ghost: Subtle
    ghost: "bg-transparent border-[#2f334d] text-gray-300 hover:bg-white/5 hover:border-gray-500 border"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 shadow-sm active:scale-[0.97]",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
