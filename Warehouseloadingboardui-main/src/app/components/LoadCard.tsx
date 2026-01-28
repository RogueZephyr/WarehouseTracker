import React from 'react';
import { Load } from '../types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { Plus, AlertTriangle, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

interface LoadCardProps {
  load: Load;
  onClick: () => void;
  onIncrement: (e: React.MouseEvent) => void;
  onMissing: (e: React.MouseEvent) => void;
  onChangeOrder?: (e: React.MouseEvent) => void;
  onMore?: (e: React.MouseEvent) => void;
}

export const LoadCard: React.FC<LoadCardProps> = ({
  load,
  onClick,
  onIncrement,
  onMissing,
  onChangeOrder,
  onMore,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 transition-colors cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">{load.vehicleId}</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">
              {load.loadOrder}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{load.clientName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-xs uppercase tracking-wider">{load.format}</span>
          </div>
        </div>
        <StatusBadge status={load.status} />
      </div>

      {/* Progress */}
      <div className="px-4 py-2">
        <ProgressBar
          current={load.loadedQty}
          total={load.expectedQty}
          missingCount={load.missingIds.length}
        />
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-100 flex items-center divide-x divide-gray-100 bg-gray-50">
        <button
          onClick={onIncrement}
          className="flex-1 py-3 text-blue-700 font-semibold text-sm flex items-center justify-center gap-1 active:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Loaded
        </button>
        <button
          onClick={onMissing}
          className="px-4 py-3 text-gray-600 active:bg-gray-100 transition-colors"
          aria-label="Set Missing"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
        <button
          onClick={onChangeOrder}
          className="px-4 py-3 text-gray-600 active:bg-gray-100 transition-colors"
          aria-label="Change Order"
        >
          <ArrowUpDown className="w-5 h-5" />
        </button>
        <button
          onClick={onMore}
          className="px-4 py-3 text-gray-600 active:bg-gray-100 transition-colors"
          aria-label="More Actions"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
