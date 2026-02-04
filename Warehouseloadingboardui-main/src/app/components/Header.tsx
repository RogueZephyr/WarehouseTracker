import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onFilterClick: () => void;
  filterActive: boolean;
  onCalendarClick?: () => void;
  calendarActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onFilterClick,
  filterActive,
  onCalendarClick,
  calendarActive,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Loading Board</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(), 'MMM d')} • Shift 1</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCalendarClick && (
            <button
              onClick={onCalendarClick}
              className={`p-2 rounded-lg transition-colors ${calendarActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Open calendar"
            >
              <Calendar className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={onFilterClick}
            className={`p-2 rounded-lg transition-colors ${filterActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <div className="relative">
              <Filter className="w-6 h-6" />
              {filterActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
