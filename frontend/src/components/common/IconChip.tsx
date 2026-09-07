import React from 'react';

export type IconChipColor = 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'indigo' | 'slate';

interface IconChipProps {
  icon: React.ReactNode;
  color?: IconChipColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles: Record<IconChipColor, string> = {
  blue: 'bg-[#0EA5E9]/15 text-[#0B7CAF] border border-[#0EA5E9]/30',
  teal: 'bg-[#0B5D63]/15 text-[#0B5D63] border border-[#0B5D63]/30',
  emerald: 'bg-[#16A34A]/15 text-[#12883E] border border-[#16A34A]/30',
  amber: 'bg-[#F59E0B]/15 text-[#A36907] border border-[#F59E0B]/30',
  rose: 'bg-[#EF4444]/15 text-[#EB1515] border border-[#EF4444]/30',
  violet: 'bg-[#7C6CF0]/15 text-[#705EEF] border border-[#7C6CF0]/30',
  sky: 'bg-[#0EA5E9]/15 text-[#0B5D63] border border-[#0EA5E9]/30',
  indigo: 'bg-[#0B5D63]/15 text-[#101828] border border-[#0B5D63]/30',
  slate: 'bg-slate-100 text-[#101828] border border-slate-200/80',
};

const sizeStyles = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export const IconChip: React.FC<IconChipProps> = ({
  icon,
  color = 'blue',
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl font-semibold shrink-0 transition-transform duration-200 ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
    >
      {icon}
    </div>
  );
};
