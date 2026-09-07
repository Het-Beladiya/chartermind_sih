import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'gradient' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[#12883E] text-white border border-[#12883E]/80 shadow-xs',
  warning: 'bg-[#A36907] text-white border border-[#A36907]/80 shadow-xs',
  danger: 'bg-[#EB1515] text-white border border-[#EB1515]/80 shadow-xs',
  gradient: 'bg-gradient-to-r from-[#0B7CAF] to-[#0B5D63] text-white border border-white/25 shadow-xs',
  info: 'bg-[#0B7CAF] text-white border border-[#0B7CAF]/80 shadow-xs',
  neutral: 'bg-[#2B3342] text-white border border-[#2B3342]/80 shadow-xs',
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5 rounded-md font-bold font-mono-data tracking-wide',
  md: 'text-xs px-2.5 py-1 rounded-md font-bold font-mono-data tracking-wide',
  lg: 'text-sm px-3 py-1.5 rounded-lg font-bold font-mono-data tracking-wide',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'gradient',
  size = 'md',
  icon,
  className = '',
  pulse = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap tracking-wide select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
