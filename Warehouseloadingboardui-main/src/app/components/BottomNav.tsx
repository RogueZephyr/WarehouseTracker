import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

interface BottomNavProps {
  onNewLoad: () => void;
  onRefresh: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNewLoad, onRefresh }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-safe z-30 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg active:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
        <button
          onClick={onNewLoad}
          className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md active:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Load
        </button>
      </div>
    </div>
  );
};
