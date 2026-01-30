import React from 'react';
import { LoadGroup } from '../types';
import { StatusBadge } from './StatusBadge';
import { Users, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface GroupCardProps {
    group: LoadGroup;
    onClick: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg border-2 border-blue-200 shadow-md active:bg-blue-50 transition-colors cursor-pointer overflow-hidden flex flex-col group"
        >
            {/* Header */}
            <div className="p-4 pb-2 flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{group.vehicleId}</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-blue-600 text-white shadow-sm">
                            <Users className="w-3 h-3" />
                            Group
                        </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Large Format Load</span>
                    </div>
                </div>
                <StatusBadge status={group.status} />
            </div>

            {/* Info Section */}
            <div className="px-4 py-3 bg-blue-50/50 border-y border-blue-100/50">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] font-bold uppercase">Max Pallets</span>
                        <span className="text-blue-700 font-bold">{group.maxPalletCount}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-[10px] font-bold uppercase">Client Loads</span>
                        <span className="text-gray-900 font-bold">{group.loads ? group.loads.length : '...'}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 text-center">
                <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                    View Group Details →
                </span>
            </div>
        </div>
    );
};
