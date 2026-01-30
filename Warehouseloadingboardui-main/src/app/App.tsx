import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoadCard } from './components/LoadCard';
import { GroupCard } from './components/GroupCard';
import { CreateLoadModal } from './components/CreateLoadModal';
import { LoadDetailModal } from './components/LoadDetailModal';
import { LoadGroupDetailModal } from './components/LoadGroupDetailModal';
import { FilterModal } from './components/FilterModal';
import { Load, LoadGroup, FilterState, LoadStatus, LoadFormat } from './types';
import { Plus, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { toast, Toaster } from 'sonner';

// --- Mappers ---

const toFrontend = (data: any): Load => {
  if (!data) throw new Error('toFrontend: No data provided');

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
    id: data.id || `unknown-${Math.random().toString(36).substr(2, 9)}`,
    vehicleId: data.vehicle_id || 'Unknown',
    loadOrder: data.load_order || 'F',
    clientName: data.client_name || 'Generic Client',
    format: formatMap[data.format] || 'Small',
    routeCode: data.route_code,
    routeGroup: data.route_group_id,
    expectedQty: Number(data.expected_qty) || 0,
    loadedQty: Number(data.loaded_qty) || 0,
    palletCount: data.pallet_count ? Number(data.pallet_count) : undefined,
    missingIds: Array.isArray(data.missing_refs) ? data.missing_refs : [],
    status: statusMap[data.status] || 'Pending',
    isNA: !!data.is_na,
    isFND: !!data.is_fnd,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    groupId: data.group_id
  };
};

const toBackend = (load: Partial<Load>): any => {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'In Process': 'in_process',
    'Complete': 'complete',
    'Verified': 'verified',
    'unverified': 'unverified'
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
    is_na: load.isNA,
    is_fnd: load.isFND,
    group_id: load.groupId,
  };

  // Remove undefined fields to avoid sending null values
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

export const getMissingCount = (missingIds: string[]): number => {
  if (!missingIds || !Array.isArray(missingIds)) return 0;
  return missingIds.reduce((acc, id) => {
    // Match "4x Item" or similar
    const match = id.match(/^(\d+)x/);
    if (match) {
      return acc + parseInt(match[1], 10);
    }
    return acc + 1;
  }, 0);
};

const toFrontendGroup = (data: any): LoadGroup => {
  if (!data) throw new Error('toFrontendGroup: No data provided');

  const statusMap: Record<string, LoadStatus> = {
    'pending': 'Pending',
    'in_process': 'In Process',
    'complete': 'Complete',
    'Pending': 'Pending',
    'In Process': 'In Process',
    'Complete': 'Complete',
  };

  return {
    id: data.id || `unknown-group-${Math.random().toString(36).substr(2, 9)}`,
    vehicleId: data.vehicle_id || 'Unknown',
    maxPalletCount: Number(data.max_pallet_count) || 0,
    status: statusMap[data.status] || 'Pending',
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    loads: Array.isArray(data.loads) ? data.loads.map((l: any) => {
      try {
        return toFrontend(l);
      } catch (e) {
        console.error('Error mapping load in group:', l, e);
        return null;
      }
    }).filter((l: any): l is Load => l !== null) : []
  };
};

const toBackendGroup = (group: Partial<LoadGroup>): any => {
  return {
    vehicle_id: group.vehicleId,
    max_pallet_count: group.maxPalletCount,
    status: group.status ? group.status.toLowerCase().replace(' ', '_') : undefined
  };
};


export default function App() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [groups, setGroups] = useState<LoadGroup[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    format: 'All',
    vehicleGroup: 'All',
    statuses: [],
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<LoadGroup | null>(null);

  // Section Collapse State (Mobile)
  const [isCompleteCollapsed, setIsCompleteCollapsed] = useState(true);

  // --- API ---
  const fetchLoads = async () => {
    try {
      const [loadsRes, groupsRes] = await Promise.all([
        fetch('/api/loads/'),
        fetch('/api/groups/')
      ]);

      if (!loadsRes.ok || !groupsRes.ok) throw new Error('Failed to fetch');

      const loadsData = await loadsRes.json();
      const groupsData = await groupsRes.json();

      const allLoads = loadsData.map(toFrontend);
      setLoads(allLoads.filter((l: Load) => !l.groupId));
      setGroups(groupsData.map(toFrontendGroup));

      // Sync selected items if they are currently being viewed
      if (selectedGroup) {
        // Re-fetch detail for selected group since list view doesn't have loads
        const detailRes = await fetch(`/api/groups/${selectedGroup.id}/`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedGroup(toFrontendGroup(detailData));
        }
      }
      if (selectedLoad) {
        const updated = allLoads.find((l: Load) => l.id === selectedLoad.id);
        if (updated) setSelectedLoad(updated);
      }
    } catch (err) {
      console.error(err);
      // Don't toast on background polling errors to avoid spamming the user
    }
  };

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 5000);
    return () => clearInterval(interval);
  }, [selectedGroup?.id, selectedLoad?.id]);

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
      pending: [
        ...filteredLoads.filter(l => l.status === 'Pending'),
        ...groups.filter(g => g.status === 'Pending')
      ],
      inProcess: [
        ...filteredLoads.filter(l => ['In Process', 'Verified', 'Unverified'].includes(l.status)),
        ...groups.filter(g => ['In Process'].includes(g.status))
      ],
      complete: [
        ...filteredLoads.filter(l => l.status === 'Complete'),
        ...groups.filter(g => g.status === 'Complete')
      ],
    };
  }, [filteredLoads, groups]);

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

  const handleStandaloneStatusChange = (load: Load, newStatus: LoadStatus) => {
    let loadedQty = load.loadedQty;
    if (newStatus === 'Complete') {
      loadedQty = Math.max(0, (Number(load.expectedQty) || 0) - (load.missingIds?.length || 0));
    }
    handleUpdateLoad({ ...load, status: newStatus, loadedQty });
  };

  const handleDeleteLoad = async (id: string) => {
    const originalLoads = [...loads];
    setLoads(prev => prev.filter(l => l.id !== id));
    setSelectedLoad(null);

    try {
      const res = await fetch(`/api/loads/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Load deleted successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete load');
      setLoads(originalLoads);
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

  const handleViewGroup = async (group: LoadGroup) => {
    if (!group || !group.id) {
      console.error('handleViewGroup: Invalid group provided', group);
      toast.error('Invalid group data');
      return;
    }

    try {
      console.log('Fetching detail for group:', group.id);
      const res = await fetch(`/api/groups/${group.id}/`);
      if (!res.ok) throw new Error(`Failed to fetch group details (Status: ${res.status})`);

      const data = await res.json();
      console.log('Group detail raw data:', data);

      const frontendGroup = toFrontendGroup(data);
      console.log('Mapped Frontend Group:', frontendGroup);

      setSelectedGroup(frontendGroup);
    } catch (err) {
      console.error('handleViewGroup Error:', err);
      toast.error('Could not load group details');
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      const res = await fetch('/api/groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toBackendGroup(groupData))
      });
      if (!res.ok) throw new Error('Failed to create group');
      fetchLoads();
      toast.success('Group created successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async (group: LoadGroup) => {
    try {
      const res = await fetch(`/api/groups/${group.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toBackendGroup(group))
      });
      if (!res.ok) throw new Error('Failed to update group');
      fetchLoads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete group');
      setSelectedGroup(null);
      fetchLoads();
      toast.success('Group deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete group');
    }
  };

  const handleAddClientLoad = async (loadData: any) => {
    try {
      const payload = toBackend(loadData);
      const res = await fetch('/api/loads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add client load');

      // Refresh current group
      if (selectedGroup) handleViewGroup(selectedGroup);
      fetchLoads();
      toast.success('Client load added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add client load');
    }
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
                {sections.pending.map(item => (
                  'maxPalletCount' in item ? (
                    <GroupCard
                      key={item.id}
                      group={item as LoadGroup}
                      onClick={() => item && handleViewGroup(item as LoadGroup)}
                    />
                  ) : (
                    <LoadCard
                      key={item.id}
                      load={item as Load}
                      onClick={() => setSelectedLoad(item as Load)}
                      onIncrement={(e) => handleQuickIncrement(e, item as Load)}
                      onMissing={(e) => handleSetMissing(e, item as Load)}
                      onMore={(e) => { e.stopPropagation(); setSelectedLoad(item as Load); }}
                      onStatusChange={(status) => handleStandaloneStatusChange(item as Load, status)}
                    />
                  )
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
                {sections.inProcess.map(item => (
                  'maxPalletCount' in item ? (
                    <GroupCard
                      key={item.id}
                      group={item as LoadGroup}
                      onClick={() => item && handleViewGroup(item as LoadGroup)}
                    />
                  ) : (
                    <LoadCard
                      key={item.id}
                      load={item as Load}
                      onClick={() => setSelectedLoad(item as Load)}
                      onIncrement={(e) => handleQuickIncrement(e, item as Load)}
                      onMissing={(e) => handleSetMissing(e, item as Load)}
                      onMore={(e) => { e.stopPropagation(); setSelectedLoad(item as Load); }}
                      onStatusChange={(status) => handleStandaloneStatusChange(item as Load, status)}
                    />
                  )
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
                {sections.complete.map(item => (
                  'maxPalletCount' in item ? (
                    <GroupCard
                      key={item.id}
                      group={item as LoadGroup}
                      onClick={() => item && handleViewGroup(item as LoadGroup)}
                    />
                  ) : (
                    <LoadCard
                      key={item.id}
                      load={item as Load}
                      onClick={() => setSelectedLoad(item as Load)}
                      onIncrement={(e) => handleQuickIncrement(e, item as Load)}
                      onMissing={(e) => handleSetMissing(e, item as Load)}
                      onMore={(e) => { e.stopPropagation(); setSelectedLoad(item as Load); }}
                      onStatusChange={(status) => handleStandaloneStatusChange(item as Load, status)}
                    />
                  )
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
        onCreateGroup={handleCreateGroup}
      />

      <LoadDetailModal
        load={selectedLoad}
        onClose={() => setSelectedLoad(null)}
        onUpdate={handleUpdateLoad}
        onDelete={handleDeleteLoad}
      />

      <LoadGroupDetailModal
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onAddLoad={handleAddClientLoad}
        onUpdateLoad={handleUpdateLoad}
        onDeleteLoad={handleDeleteLoad}
        onInspectLoad={setSelectedLoad}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}
