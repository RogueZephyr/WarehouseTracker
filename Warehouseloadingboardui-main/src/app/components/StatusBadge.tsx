import React from 'react';
import { clsx } from 'clsx';
import { LoadStatus } from '../types';

interface StatusBadgeProps {
  status: LoadStatus;
  size?: 'sm' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<LoadStatus, { bg: string; text: string; label: string }> = {
  'Pending': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
  'In Process': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Process' },
  'Complete': { bg: 'bg-green-100', text: 'text-green-800', label: 'Complete' },
  'Verified': { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Verified' },
  'Unverified': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Unverified' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
};
