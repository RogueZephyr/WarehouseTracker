import React, { useState, useMemo } from 'react';
import { Load, LoadGroup, LoadStatus } from '../types';
import { getMissingCount } from '../App';
import { StatusBadge } from './StatusBadge';
import { X, Plus, Trash2, AlertTriangle, Users, Calculator, ClipboardList, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface LoadGroupDetailModalProps {
    group: LoadGroup | null;
    onClose: () => void;
    onUpdateGroup: (group: LoadGroup) => void;
    onDeleteGroup: (id: string) => void;
    onAddLoad: (loadData: any) => void;
    onUpdateLoad: (load: Load) => void;
    onDeleteLoad: (id: string) => void;
    onInspectLoad: (load: Load) => void;
}

export const LoadGroupDetailModal: React.FC<LoadGroupDetailModalProps> = ({
    group,
    onClose,
    onUpdateGroup,
    onDeleteGroup,
    onAddLoad,
    onUpdateLoad,
    onDeleteLoad,
    onInspectLoad
}) => {
    console.log('Rendering LoadGroupDetailModal with group:', group);
    const [isAddingLoad, setIsAddingLoad] = useState(false);
    const [newLoad, setNewLoad] = useState({
        clientName: '',
        loadOrder: 'F',
        expectedQty: 0,
        palletCount: 0
    });

    const totalPallets = useMemo(() => {
        if (!group?.loads) return 0;
        return group.loads.reduce((sum, l) => sum + (Number(l.palletCount) || 0), 0);
    }, [group?.loads]);

    const isOverCapacity = group ? totalPallets > group.maxPalletCount : false;

    if (!group) return null;

    const handleAddLoadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLoad.clientName || newLoad.expectedQty <= 0 || newLoad.palletCount <= 0) {
            toast.error('Please fill all fields correctly');
            return;
        }

        onAddLoad({
            ...newLoad,
            vehicleId: group.vehicleId,
            format: 'Large',
            groupId: group.id
        });

        setIsAddingLoad(false);
        setNewLoad({ clientName: '', loadOrder: 'F', expectedQty: 0, palletCount: 0 });
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-xl shadow-2xl flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-blue-600 text-white sm:rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6" />
                            <h2 className="text-2xl font-bold">{group.vehicleId} Group</h2>
                            <StatusBadge status={group.status} />
                        </div>
                        <p className="mt-1 text-blue-100 text-sm">
                            Large Format Group Management
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-blue-100 hover:bg-blue-700 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Group Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
                        <div className={clsx(
                            "p-4 rounded-xl border flex flex-col gap-1 transition-colors min-w-[200px]",
                            isOverCapacity ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                        )}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pallet Load</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={clsx("text-2xl font-black", isOverCapacity ? "text-red-600" : "text-blue-700")}>{totalPallets}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600 font-bold">{group.maxPalletCount}</span>
                            </div>
                            {isOverCapacity && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-600">
                                    EXCEEDS CAPACITY
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-1 min-w-[140px]">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Clients</span>
                            <span className="text-2xl font-black text-gray-900">{group.loads?.length || 0}</span>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-1 min-w-[140px]">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Items Expected</span>
                            <span className="text-2xl font-black text-gray-900">
                                {group.loads?.reduce((sum, l) => sum + (Number(l.expectedQty) || 0), 0) || 0}
                            </span>
                        </div>
                    </div>

                    {/* Client Loads List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-gray-400" />
                                Client Loads
                            </h3>
                            {!isAddingLoad && (
                                <button
                                    onClick={() => setIsAddingLoad(true)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add Client
                                </button>
                            )}
                        </div>

                        {isAddingLoad && (
                            <form onSubmit={handleAddLoadSubmit} className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-blue-200 grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Client Name</label>
                                    <input
                                        autoFocus
                                        value={newLoad.clientName}
                                        onChange={e => setNewLoad({ ...newLoad, clientName: e.target.value })}
                                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="e.g. Walmart"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pos</label>
                                    <select
                                        value={newLoad.loadOrder}
                                        onChange={e => setNewLoad({ ...newLoad, loadOrder: e.target.value as any })}
                                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                    >
                                        <option value="F">F</option>
                                        <option value="MF">MF</option>
                                        <option value="M">M</option>
                                        <option value="MP">MP</option>
                                        <option value="P">P</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty</label>
                                    <input
                                        type="number"
                                        value={newLoad.expectedQty}
                                        onChange={e => setNewLoad({ ...newLoad, expectedQty: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plt</label>
                                        <input
                                            type="number"
                                            value={newLoad.palletCount}
                                            onChange={e => setNewLoad({ ...newLoad, palletCount: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-1 mb-0.5">
                                        <button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => setIsAddingLoad(false)} className="p-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            {/* Desktop Table View */}
                            <table className="w-full text-left hidden md:table">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Pos</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Client</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Qty / Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Plt</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {group.loads?.length === 0 && !isAddingLoad && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm italic">
                                                No client loads added yet.
                                            </td>
                                        </tr>
                                    )}
                                    {group.loads?.map((load) => (
                                        <tr key={load.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{load.loadOrder}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{load.clientName}</span>
                                                    <div className="flex gap-1 mt-0.5">
                                                        {load.palletCount !== undefined && (
                                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold rounded border border-blue-200 uppercase tracking-tighter">
                                                                PLT {load.palletCount}
                                                            </span>
                                                        )}
                                                        {load.isNA && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded border border-gray-200 uppercase tracking-tighter">N/A</span>}
                                                        {load.isFND && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded border border-amber-200 uppercase tracking-tighter">FND</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            value={load.loadedQty}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value, 10) || 0;
                                                                onUpdateLoad({ ...load, loadedQty: val });
                                                            }}
                                                            className="w-16 px-2 py-0.5 text-center font-black text-blue-600 bg-blue-50/50 border border-blue-100 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                                        />
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-gray-900 font-bold">{load.expectedQty}</span>
                                                    </div>
                                                    <select
                                                        value={load.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value as LoadStatus;
                                                            let loadedQty = load.loadedQty;
                                                            if (newStatus === 'Complete') {
                                                                loadedQty = Math.max(0, (Number(load.expectedQty) || 0) - getMissingCount(load.missingIds));
                                                            }
                                                            onUpdateLoad({ ...load, status: newStatus, loadedQty });
                                                        }}
                                                        className={clsx(
                                                            "text-[10px] font-bold uppercase py-0.5 px-2 rounded border focus:ring-1 outline-none appearance-none cursor-pointer",
                                                            load.status === 'Complete' ? "bg-green-50 text-green-700 border-green-200" :
                                                                load.status === 'Pending' ? "bg-gray-50 text-gray-700 border-gray-200" :
                                                                    "bg-blue-50 text-blue-700 border-blue-200"
                                                        )}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Process">In Process</option>
                                                        <option value="Complete">Complete</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-700 text-center">{load.palletCount}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => onInspectLoad(load)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Inspect Load"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteLoad(load.id)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                                                        title="Delete Load"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {group.loads?.length === 0 && !isAddingLoad && (
                                    <div className="px-4 py-12 text-center text-gray-400 text-sm italic">
                                        No client loads added yet.
                                    </div>
                                )}
                                {group.loads?.map((load) => (
                                    <div key={load.id} className="p-4 space-y-4 bg-white active:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">{load.loadOrder}</span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{load.clientName}</span>
                                                    <div className="flex gap-1 mt-0.5">
                                                        {load.palletCount !== undefined && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold rounded border border-blue-200 uppercase">PLT {load.palletCount}</span>}
                                                        {load.isNA && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded border border-gray-200 uppercase">N/A</span>}
                                                        {load.isFND && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded border border-amber-200 uppercase">FND</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onInspectLoad(load)}
                                                    className="p-2 text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteLoad(load.id)}
                                                    className="p-2 text-red-500 bg-red-50 rounded-lg active:bg-red-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={load.loadedQty}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value, 10) || 0;
                                                            onUpdateLoad({ ...load, loadedQty: val });
                                                        }}
                                                        className="w-16 px-2 py-1 text-center font-black text-blue-600 bg-white border border-blue-100 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-sm font-bold text-gray-900">{load.expectedQty}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Pallets</span>
                                                <span className="text-sm font-black text-gray-700">{load.palletCount}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 text-right">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                                                <select
                                                    value={load.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value as LoadStatus;
                                                        let loadedQty = load.loadedQty;
                                                        if (newStatus === 'Complete') {
                                                            loadedQty = Math.max(0, (Number(load.expectedQty) || 0) - getMissingCount(load.missingIds));
                                                        }
                                                        onUpdateLoad({ ...load, status: newStatus, loadedQty });
                                                    }}
                                                    className={clsx(
                                                        "text-[10px] font-bold uppercase py-1 px-2 rounded border focus:ring-1 outline-none",
                                                        load.status === 'Complete' ? "bg-green-50 text-green-700 border-green-200" :
                                                            load.status === 'Pending' ? "bg-gray-50 text-gray-700 border-gray-200" :
                                                                "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Process">In Process</option>
                                                    <option value="Complete">Complete</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-xl flex justify-between items-center gap-4">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this group and all its loads?')) {
                                onDeleteGroup(group.id);
                            }
                        }}
                        className="px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        DELETE GROUP
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:translate-y-0.5"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
};
