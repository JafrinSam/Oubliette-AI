import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, List, Calendar as CalIcon } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import { ShowAPI } from '../../services/adminapi';

// Imports from new components
import ShowCard from '../../components/admin/show/ShowCard';
import ShowSkeleton from '../../components/admin/show/ShowSkeleton';
import MasterCalendar from '../../components/admin/show/MasterCalendar';
import ShowDetailsModal from '../../components/admin/show/modals/ShowDetailsModal';
import CreateShowModal from '../../components/admin/show/modals/CreateShowModal'; // You need to create this file
import ScheduleModal from '../../components/admin/show/modals/ScheduleModal';     // You need to create this file

export default function ShowManager() {
  const { themeName } = useTheme();
  const [activeTab, setActiveTab] = useState('shows');
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editShow, setEditShow] = useState(null);
  const [scheduleShow, setScheduleShow] = useState(null);
  const [viewShow, setViewShow] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try { const { data } = await ShowAPI.getAll(); setShows(data.data); } 
    catch (e) { toast.error("Failed to load shows"); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  
  const handleDeleteShow = async (id) => { if(window.confirm('Delete?')) { await ShowAPI.delete(id); loadData(); toast.success("Deleted"); } };
  
  const filteredShows = shows.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'live' ? s.isLive : !s.isLive;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Toaster position="bottom-right" richColors theme={themeName} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div><h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Programming</h1><p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>Manage your station's shows.</p></div>
        <div className="border p-1.5 rounded-xl flex shadow-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => setActiveTab('shows')} className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2" style={{ backgroundColor: activeTab === 'shows' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'shows' ? '#FFF' : 'var(--text-secondary)' }}><List size={18}/> Shows List</button>
          <button onClick={() => setActiveTab('calendar')} className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2" style={{ backgroundColor: activeTab === 'calendar' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'calendar' ? '#FFF' : 'var(--text-secondary)' }}><CalIcon size={18}/> Master Calendar</button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'shows' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-4 p-2 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-transparent border-none py-3 pl-12 pr-4 focus:ring-0 text-base outline-none" style={{ color: 'var(--text-primary)' }} /></div>
            <div className="h-auto w-[1px] hidden md:block" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="flex gap-3 px-2 items-center"><Filter size={18} style={{ color: 'var(--text-secondary)' }}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent border-none text-sm font-semibold focus:ring-0 cursor-pointer outline-none" style={{ color: 'var(--text-primary)' }}><option value="all" style={{ backgroundColor: 'var(--bg-secondary)' }}>All Status</option><option value="live" style={{ backgroundColor: 'var(--bg-secondary)' }}>Live Now</option><option value="offline" style={{ backgroundColor: 'var(--bg-secondary)' }}>Offline</option></select></div>
            <button onClick={() => { setEditShow(null); setCreateModal(true); }} className="px-6 py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-lg text-white" style={{ backgroundColor: 'var(--accent-color)' }}><Plus size={20} /> Create Show</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading && <><ShowSkeleton/><ShowSkeleton/><ShowSkeleton/></>}
            {!loading && filteredShows.map(show => (
                <ShowCard 
                    key={show._id} show={show} 
                    onView={(s) => setViewShow(s)} 
                    onEdit={(s) => { setEditShow(s); setCreateModal(true); }} 
                    onSchedule={(s) => setScheduleShow(s)} 
                    onDelete={handleDeleteShow} 
                />
            ))}
            {!loading && filteredShows.length === 0 && <div className="col-span-full py-24 text-center"><h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No shows found</h3></div>}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><MasterCalendar shows={shows} /></div>}
      
      {createModal && <CreateShowModal show={editShow} onClose={() => setCreateModal(false)} onSuccess={() => { setCreateModal(false); loadData(); }} />}
      {scheduleShow && <ScheduleModal show={scheduleShow} onClose={() => setScheduleShow(null)} onRefresh={loadData} />}
      {viewShow && <ShowDetailsModal show={viewShow} onClose={() => setViewShow(null)} />}
    </div>
  );
}