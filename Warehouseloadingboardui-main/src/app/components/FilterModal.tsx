import React from 'react';
import { FilterState, LoadFormat, LoadStatus } from '../types';
import { X, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  // Sync when opening
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggleStatus = (status: LoadStatus) => {
    setLocalFilters(prev => {
      const exists = prev.statuses.includes(status);
      if (exists) {
        return { ...prev, statuses: prev.statuses.filter(s => s !== status) };
      } else {
        return { ...prev, statuses: [...prev.statuses, status] };
      }
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="pointer-events-auto bg-white w-full sm:max-w-md sm:rounded-xl shadow-xl flex flex-col max-h-[85vh] transition-transform duration-300 transform translate-y-0">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Filter Board</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Format */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Format</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['All', 'Small', 'Large'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLocalFilters({ ...localFilters, format: opt })}
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    localFilters.format === opt
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Group */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Vehicle Group</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['All', '26 Group', '28 Group', '23 (Walgreens)'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLocalFilters({ ...localFilters, vehicleGroup: opt })}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-lg border text-left transition-all",
                    localFilters.vehicleGroup === opt
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {opt === 'All' ? 'All Groups' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Statuses</h3>
             <div className="flex flex-wrap gap-2">
               {(['Pending', 'In Process', 'Complete', 'Verified', 'Unverified'] as LoadStatus[]).map((status) => {
                 const isActive = localFilters.statuses.includes(status);
                 return (
                   <button
                     key={status}
                     onClick={() => toggleStatus(status)}
                     className={clsx(
                       "px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5",
                       isActive
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                     )}
                   >
                     {isActive && <Check className="w-3.5 h-3.5" />}
                     {status}
                   </button>
                 );
               })}
             </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-xl flex gap-3">
           <button
             onClick={() => setLocalFilters({ format: 'All', vehicleGroup: 'All', statuses: [] })}
             className="flex-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
           >
             Reset
           </button>
           <button
             onClick={handleApply}
             className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm"
           >
             Apply Filters
           </button>
        </div>

      </div>
    </div>
  );
};
