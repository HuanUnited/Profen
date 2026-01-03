// frontend/src/components/atomic/StylizedButton.tsx
import { ReactNode } from 'react';
import clsx from 'clsx';

interface StylizedButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  rightElement?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function StylizedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  rightElement,
  onClick,
  className = "",
  disabled = false
}: StylizedButtonProps) {

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base'
  };

  const variantClasses = {
    primary: 'bg-black text-white shadow hover:bg-black/90 hover:ring-2 hover:ring-black hover:ring-offset-2 active:ring-4 active:ring-black/50 active:ring-offset-4',
    secondary: 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:ring-2 hover:ring-white/30 hover:ring-offset-2 active:ring-4 active:ring-white/20',
    ghost: 'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "group relative flex items-center justify-center gap-2 overflow-hidden rounded-md font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 whitespace-pre active:scale-[0.96]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {/* Shimmer Effect - SLOWED from duration-1000 to duration-2000 */}
      {variant !== 'ghost' && (
        <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-white opacity-10 transition-all duration-2000 ease-out group-hover:-translate-x-40" />
      )}

      <div className="flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </div>

      {rightElement && (
        <div className="ml-1 flex items-center border-l border-white/20 pl-2">
          {rightElement}
        </div>
      )}
    </button>
  );
}
