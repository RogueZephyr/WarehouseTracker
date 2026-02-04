import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  current: number;
  total: number;
  missingCount?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, missingCount = 0, className }) => {
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
  
  return (
    <div className={clsx('w-full', className)}>
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-baseline space-x-1">
          <span
            className={clsx(
              "text-2xl font-bold leading-none",
              current > total ? "text-red-600" : "text-gray-900"
            )}
          >
            {current}
          </span>
          <span className="text-sm text-gray-500 font-medium">/ {total}</span>
        </div>
        {missingCount > 0 && (
          <span className="text-orange-600 font-medium text-sm">
            Missing: {missingCount}
          </span>
        )}
      </div>
      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            percentage === 100 ? "bg-green-500" : "bg-blue-600"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
