import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoadCard } from './components/LoadCard';
import { CreateLoadModal } from './components/CreateLoadModal';
import { LoadDetailModal } from './components/LoadDetailModal';
import { FilterModal } from './components/FilterModal';
import { Load, FilterState, LoadStatus, LoadFormat } from './types';
import { Plus, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { toast, Toaster } from 'sonner';

// --- Mappers ---

const toFrontend = (data: any): Load => {
  // Map status Title Case
  const statusMap: Record<string, LoadStatus> = {
    'pending': 'Pending',
    'in_process': 'In Process',
    'complete': 'Complete',
    'verified': 'Verified',
    'unverified': 'Unverified',
    // Fallbacks
    'Pending': 'Pending',
    'In Process': 'In Process',
    'Complete': 'Complete',
    'Verified': 'Verified',
    'Unverified': 'Unverified'
  };

  const formatMap: Record<string, LoadFormat> = {
    'small': 'Small',
    'large': 'Large',
    'Small': 'Small',
    'Large': 'Large'
  };

  return {
    id: data.id,
    vehicleId: data.vehicle_id || 'Unknown',
    loadOrder: data.load_order, // 'F', 'MF' etc match
    clientName: data.client_name,
    format: formatMap[data.format] || 'Small',
    routeCode: data.route_code,
    routeGroup: data.route_group_id, // assuming mapping
    expectedQty: data.expected_qty,
    loadedQty: data.loaded_qty || 0,
    palletCount: data.pallet_count,
    missingIds: data.missing_refs || [],
    status: statusMap[data.status] || 'Pending',
    createdAt: new Date(data.created_at)
  };
};

const toBackend = (load: Partial<Load>): any => {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'In Process': 'in_process',
    'Complete': 'complete',
    'Verified': 'verified',
    'Unverified': 'unverified'
  };
  const formatMap: Record<string, string> = {
    'Small': 'small',
    'Large': 'large'
  };

  const payload: any = {
    client_name: load.clientName,
    expected_qty: load.expectedQty ? Number(load.expectedQty) : undefined,
    format: load.format ? formatMap[load.format] : undefined,
    load_order: load.loadOrder,
    route_code: load.routeCode,
    route_group_id: load.routeGroup,
    pallet_count: load.palletCount ? Number(load.palletCount) : undefined,
    vehicle_id: load.vehicleId,
    status: load.status ? statusMap[load.status] : undefined,
    loaded_qty: load.loadedQty !== undefined ? Number(load.loadedQty) : undefined,
    missing_refs: load.missingIds || [],
  };

  // Remove undefined fields to avoid sending null values
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};


export default function App() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    format: 'All',
    vehicleGroup: 'All',
    statuses: [],
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  // Section Collapse State (Mobile)
  const [isCompleteCollapsed, setIsCompleteCollapsed] = useState(true);

  // --- API ---
  const fetchLoads = async () => {
    try {
      const res = await fetch('/api/loads/');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLoads(data.map(toFrontend));
    } catch (err) {
      console.error(err);
      toast.error('Could not load data');
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  // Derived State
  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      // Format Filter
      if (filters.format !== 'All' && load.format !== filters.format) return false;

      // Vehicle Group Filter (Mock logic: starts with)
      if (filters.vehicleGroup !== 'All') {
        if (filters.vehicleGroup === '26 Group' && !load.vehicleId.startsWith('26')) return false;
        if (filters.vehicleGroup === '28 Group' && !load.vehicleId.startsWith('28')) return false;
        if (filters.vehicleGroup === '23 (Walgreens)' && !load.routeCode?.startsWith('23')) return false;
      }

      // Status Filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(load.status)) return false;

      return true;
    });
  }, [loads, filters]);

  const sections = useMemo(() => {
    return {
      pending: filteredLoads.filter(l => l.status === 'Pending'),
      inProcess: filteredLoads.filter(l => ['In Process', 'Verified', 'Unverified'].includes(l.status)),
      complete: filteredLoads.filter(l => l.status === 'Complete'),
    };
  }, [filteredLoads]);

  // Handlers
  const handleCreateLoad = async (newLoadData: any) => {
    try {
      // newLoadData is coming from form, likely camelCase.
      // We need to construct backend payload.
      // The modal likely returns an object matching the Load interface roughly.
      // We might need to ensure vehicleId etc are present.

      // For prototype, assuming Modal returns valid partial Load.
      const payload = toBackend(newLoadData);
      // Default assignment if missing
      if (!payload.vehicle_id) payload.vehicle_id = "Temp-" + Math.floor(Math.random() * 1000);

      const res = await fetch('/api/loads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create');

      const created = await res.json();
      const frontendLoad = toFrontend(created);

      setLoads(prev => [frontendLoad, ...prev]);
      toast.success('Load created successfully');
      setIsCreateOpen(false); // Close modal
    } catch (e) {
      console.error(e);
      toast.error('Failed to create load');
    }
  };

  const handleUpdateLoad = async (updatedLoad: Load) => {
    // Optimistic update
    const originalLoads = [...loads];
    setLoads(prev => prev.map(l => l.id === updatedLoad.id ? updatedLoad : l));
    if (selectedLoad?.id === updatedLoad.id) {
      setSelectedLoad(updatedLoad);
    }

    try {
      const payload = toBackend(updatedLoad);
      const res = await fetch(`/api/loads/${updatedLoad.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update');
      // Optionally sync back from response
    } catch (e) {
      console.error(e);
      toast.error('Failed to save changes');
      setLoads(originalLoads); // Revert
    }
  };

  const handleQuickIncrement = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    if (load.loadedQty < load.expectedQty) {
      handleUpdateLoad({ ...load, loadedQty: load.loadedQty + 1 });
      toast.success(`Loaded +1 for ${load.vehicleId}`);
    }
  };

  const handleSetMissing = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    setSelectedLoad(load);
  };

  const handleRefresh = () => {
    fetchLoads();
    toast.info('Board refreshed');
  };

  const filterActive = filters.format !== 'All' || filters.vehicleGroup !== 'All' || filters.statuses.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Toaster position="top-center" />

      <Header
        onFilterClick={() => setIsFilterOpen(true)}
        filterActive={filterActive}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 md:pb-4">
        <div className="max-w-7xl mx-auto h-full">

          {/* Desktop Controls (Hidden on Mobile) */}
          <div className="hidden md:flex justify-end mb-4 gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> New Load
            </button>
          </div>

          {/* Board Layout */}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-6 h-full">

            {/* Pending Column */}
            <section className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  Pending
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{sections.pending.length}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {sections.pending.map(load => (
                  <LoadCard
                    key={load.id}
                    load={load}
                    onClick={() => setSelectedLoad(load)}
                    onIncrement={(e) => handleQuickIncrement(e, load)}
                    onMissing={(e) => handleSetMissing(e, load)}
                    onMore={(e) => { e.stopPropagation(); setSelectedLoad(load); }}
                  />
                ))}
                {sections.pending.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No pending loads
                  </div>
                )}
              </div>
            </section>

            {/* In Process Column */}
            <section className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2">
                <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  In Process
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{sections.inProcess.length}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {sections.inProcess.map(load => (
                  <LoadCard
                    key={load.id}
                    load={load}
                    onClick={() => setSelectedLoad(load)}
                    onIncrement={(e) => handleQuickIncrement(e, load)}
                    onMissing={(e) => handleSetMissing(e, load)}
                    onMore={(e) => { e.stopPropagation(); setSelectedLoad(load); }}
                  />
                ))}
                {sections.inProcess.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No active loads
                  </div>
                )}
              </div>
            </section>

            {/* Complete Column */}
            <section className="flex flex-col gap-3 min-w-0">
              <div
                className="flex items-center justify-between sticky top-0 bg-gray-50 z-10 py-2 cursor-pointer md:cursor-default"
                onClick={() => setIsCompleteCollapsed(!isCompleteCollapsed)}
              >
                <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Complete
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{sections.complete.length}</span>
                </h2>
                <div className="md:hidden text-gray-500">
                  {isCompleteCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              <div className={clsx("space-y-3", isCompleteCollapsed && "hidden md:block")}>
                {sections.complete.map(load => (
                  <LoadCard
                    key={load.id}
                    load={load}
                    onClick={() => setSelectedLoad(load)}
                    onIncrement={(e) => handleQuickIncrement(e, load)}
                    onMissing={(e) => handleSetMissing(e, load)}
                    onMore={(e) => { e.stopPropagation(); setSelectedLoad(load); }}
                  />
                ))}
                {sections.complete.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No completed loads today
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>

      <BottomNav
        onNewLoad={() => setIsCreateOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Modals */}
      <CreateLoadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateLoad}
      />

      <LoadDetailModal
        load={selectedLoad}
        onClose={() => setSelectedLoad(null)}
        onUpdate={handleUpdateLoad}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
