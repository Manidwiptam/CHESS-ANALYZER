import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ClayCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('clay-card p-6 relative overflow-hidden', className)}>
    {/* Subtle Madhubani-inspired pattern overlay */}
    <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    {children}
  </div>
);

export const ClayButton = ({ 
  children, 
  className, 
  onClick, 
  variant = 'default',
  title
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'inset';
  title?: string;
}) => {
  const variants = {
    default: 'clay-button px-4 py-2 font-medium',
    primary: 'clay-button-primary px-6 py-3 font-bold text-white',
    inset: 'clay-inset px-4 py-2 font-medium active:scale-95 transition-transform'
  };

  return (
    <button 
      onClick={onClick} 
      className={cn(variants[variant], className)}
      title={title}
    >
      {children}
    </button>
  );
};

export const ClayInput = ({ 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn(
      'clay-inset w-full px-4 py-3 bg-mud outline-none focus:ring-2 focus:ring-clay/30 transition-all',
      className
    )} 
    {...props} 
  />
);
