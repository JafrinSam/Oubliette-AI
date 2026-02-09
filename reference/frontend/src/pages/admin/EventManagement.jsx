import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, MapPin, Edit2, Trash2, Eye, AlertCircle, RotateCw, 
  Copy, ArrowUpDown, ChevronLeft, ChevronRight, Calendar, Clock 
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../services/apiClient'; 
import useFetch from '../../hooks/useFetch'; 
import EventFormModal from '../../components/admin/event/EventFormModal';
import EventViewModal from '../../components/admin/event/EventViewModal';

// ... (Keep your Helper Functions: getCategoryStyle, getEventTimingStatus, EventDateDisplay, StatusBadge, TableSkeleton) ...
// (I am omitting them here to save space, but DO NOT remove them from your file)

// --- HELPER: Category Colors ---
const getCategoryStyle = (category) => {
    const styles = {
      'Tech': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
      'Cultural': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      'Academic': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      'Sports': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
      'Workshop': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
    };
    return styles[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };
  
  // --- HELPER: Calculate Event Status ---
  const getEventTimingStatus = (event) => {
    if (!event.date || !event.endDate) return 'upcoming';
    const now = new Date();
    
    const parseDateTime = (isoDate, timeStr) => {
      const datePart = isoDate.split('T')[0]; 
      const timePart = timeStr || "00:00";
      return new Date(`${datePart}T${timePart}:00`);
    };
  
    const startDate = parseDateTime(event.date, event.time);
    const endDate = parseDateTime(event.endDate, event.endTime);
  
    if (now > endDate) return 'past';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'upcoming';
  };
  
  // --- HELPER: Format Date Range for Display ---
  const EventDateDisplay = ({ start, end, startTime, endTime, isOngoing }) => {
      const sDate = new Date(start);
      const eDate = new Date(end);
      const isSameDay = sDate.toDateString() === eDate.toDateString();
  
      const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
      if (isSameDay) {
          return (
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 font-medium">
                      <Calendar size={14} className="opacity-60" />
                      <span>{formatDate(sDate)}, {sDate.getFullYear()}</span>
                  </div>
                  <div className={`text-xs flex items-center gap-1.5 mt-1 ${isOngoing ? 'text-[var(--accent-color)] font-bold' : 'opacity-60'}`}>
                      <Clock size={12} />
                      {startTime} - {endTime}
                      {isOngoing && <span className="animate-pulse ml-1 text-[10px] uppercase tracking-wider">● Now</span>}
                  </div>
              </div>
          );
      }
  
      return (
          <div className="flex flex-col text-xs gap-1">
              <div className="flex items-center gap-1.5 opacity-90">
                  <span className="font-medium text-sm">{formatDate(sDate)}</span>
                  <span className="opacity-50 text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded">{startTime}</span>
              </div>
              <div className="flex items-center gap-1 opacity-40 text-[10px] pl-1">
                  <div className="w-0.5 h-2 bg-current rounded-full"></div>
                  <span>to</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-90">
                  <span className="font-medium text-sm">{formatDate(eDate)}</span>
                  <span className="opacity-50 text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded">{endTime}</span>
              </div>
          </div>
      );
  };
  
  // --- COMPONENT: Status Badge ---
  const StatusBadge = ({ status, timingStatus }) => {
    if (timingStatus === 'ongoing') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"></span>
          ONGOING
        </span>
      );
    }
  
    const colors = {
      'Open': 'text-green-600 bg-green-500/10 border-green-500/20',
      'Closed': 'text-red-600 bg-red-500/10 border-red-500/20',
      'Coming Soon': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      'Filling Fast': 'text-orange-600 bg-orange-500/10 border-orange-500/20',
      'Registration Closed': 'text-gray-600 bg-gray-500/10 border-gray-500/20',
      'Pending': 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20' 
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors[status] || 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
        {status}
      </span>
    );
  };
  
  // --- COMPONENT: Skeleton Loader ---
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <tr key={i} className="border-b border-[var(--border-color)] animate-pulse">
          <td className="p-4 w-10"><div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" /></td>
          <td className="p-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0" />
               <div className="space-y-2 w-full max-w-[150px]">
                 <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                 <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
               </div>
             </div>
          </td>
          <td className="p-4"><div className="space-y-2 max-w-[120px]"><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" /><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" /></div></td>
          <td className="p-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-md" /></td>
          <td className="p-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" /></td>
          <td className="p-4 text-right"><div className="flex items-center justify-end gap-2"><div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" /><div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" /></div></td>
        </tr>
      ))}
    </>
  );

export default function EventManagement() {
  const { get, del, loading: apiLoading } = useFetch();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  // 1. New State for Debounced Search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState('active'); 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [selectedIds, setSelectedIds] = useState([]);
  
  // 2. Initialize loading to TRUE to prevent initial flash
  const [localLoading, setLocalLoading] = useState(true);
  const isLoading = localLoading || apiLoading;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 3. Debounce Effect: Updates `debouncedSearch` 500ms after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 4. Fetch Function
  const fetchEvents = useCallback(async (isManual = false) => {
    // Only set loading to true manually if it's a manual refresh (to show spinner)
    // For automatic fetches, the API hook handles it, or we rely on initial localLoading
    if (isManual) setLocalLoading(true);

    const queryParams = {
      page,
      limit: 8,
      sort: sortOrder,
      ...(categoryFilter !== 'All' && { category: categoryFilter }),
      ...(debouncedSearch && { search: debouncedSearch }) // Use debounced value
    };

    const { success, data } = await get('/events', { params: queryParams });

    if (success) {
      setEvents(data.data || []);
      setTotalPages(data.totalPages || 1);
      if (isManual) toast.success("Events refreshed");
    } else {
      setEvents([]);
    }
    
    // Ensure local loading is turned off after fetch
    setLocalLoading(false);
  }, [get, categoryFilter, debouncedSearch, page, sortOrder]); // Depend on debouncedSearch

  // 5. Trigger Fetch Effect: Runs IMMEDIATELY when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, debouncedSearch]); // Reset page on filter change

  useEffect(() => {
    fetchEvents();
    // No setTimeout here! We want immediate fetch on filter change.
    // The debounce happens in step 3.
  }, [fetchEvents]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete event?")) return;
    const { success } = await del(`/events/${id}`, { successMessage: "Event deleted successfully" });
    if (success) {
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchEvents();
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} items?`)) return;
    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/events/${id}`)));
      toast.success("Bulk delete successful");
      setSelectedIds([]);
      fetchEvents();
    } catch (error) { toast.error("Bulk delete failed"); }
  };

  const handleClone = (event) => {
    const clonedEvent = { ...event, _id: null, title: `${event.title} (Copy)`, creationStatus: 'pending', thumbnail: 'default-event.jpg' };
    setSelectedEvent(clonedEvent);
    setIsFormOpen(true);
  };

  const toggleSelectAll = () => selectedIds.length === filteredEvents.length ? setSelectedIds([]) : setSelectedIds(filteredEvents.map(e => e._id));
  const toggleSelectRow = (id) => selectedIds.includes(id) ? setSelectedIds(prev => prev.filter(item => item !== id)) : setSelectedIds(prev => [...prev, id]);

  const filteredEvents = events.filter(event => {
    const timingStatus = getEventTimingStatus(event);
    if (viewMode === 'active') return timingStatus !== 'past'; 
    if (viewMode === 'past') return timingStatus === 'past';
    return true;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Event Manager</h1>
          <p className="text-[var(--text-secondary)] mt-1">Organize, schedule, and track college activities.</p>
        </div>
        <div className="flex gap-3">
            {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-all">
                    <Trash2 size={18} /> Delete ({selectedIds.length})
                </button>
            )}
            <button onClick={() => fetchEvents(true)} className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <RotateCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:brightness-110 shadow-lg shadow-[var(--accent-color)]/20">
                <Plus size={18} /> Create Event
            </button>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex gap-6 border-b border-[var(--border-color)] mb-6">
          <button onClick={() => setViewMode('active')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'active' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent opacity-60'}`}>
            Active
            <span className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-[10px] px-2 py-0.5 rounded-full">
                {events.filter(e => getEventTimingStatus(e) !== 'past').length}
            </span>
          </button>
          <button onClick={() => setViewMode('past')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'past' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent opacity-60'}`}>
            Past
             <span className="bg-gray-500/10 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                {events.filter(e => getEventTimingStatus(e) === 'past').length}
            </span>
          </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
          <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] text-sm" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] text-sm">
          <option value="All">All Categories</option>
          <option value="Tech">Tech</option>
          <option value="Cultural">Cultural</option>
          <option value="Academic">Academic</option>
          <option value="Sports">Sports</option>
          <option value="Workshop">Workshop</option>
        </select>
        <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm">
            <ArrowUpDown size={16} />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase font-semibold opacity-70">
              <tr>
                <th className="p-4 w-10">
                    <input type="checkbox" className="rounded border-[var(--border-color)] w-4 h-4 cursor-pointer" checked={selectedIds.length > 0 && selectedIds.length === filteredEvents.length} onChange={toggleSelectAll} />
                </th>
                <th className="p-4">Event Name</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {isLoading ? ( <TableSkeleton /> ) : filteredEvents.length === 0 ? (
                <tr><td colSpan="6" className="p-16 text-center opacity-50">No {viewMode} events found.</td></tr>
              ) : (
                filteredEvents.map((event) => {
                  const isPending = event.creationStatus === 'pending';
                  const isSelected = selectedIds.includes(event._id);
                  const timingStatus = getEventTimingStatus(event);
                  const isOngoing = timingStatus === 'ongoing';
                  const isPast = timingStatus === 'past';
                  
                  return (
                    <tr 
                        key={event._id} 
                        className={`transition-all duration-300 group border-l-4 relative
                        ${isSelected ? 'bg-[var(--accent-color)]/5 border-[var(--accent-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent'}
                        ${isOngoing ? 'bg-[var(--accent-color)]/5 border-l-[var(--accent-color)] shadow-[inset_0_0_15px_rgba(var(--accent-rgb),0.05)]' : ''} 
                        ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      <td className="p-4">
                        <input type="checkbox" className="rounded border-[var(--border-color)] w-4 h-4 cursor-pointer" checked={isSelected} onChange={() => toggleSelectRow(event._id)} />
                      </td>

                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail / Initial */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 relative transition-transform
                            ${isPending ? 'bg-yellow-500/10 text-yellow-600' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'}
                            ${isOngoing ? 'ring-2 ring-[var(--accent-color)]/50 ring-offset-2 ring-offset-[var(--bg-card)]' : ''}
                            `}>
                             {isPending ? <AlertCircle size={18}/> : event.title.charAt(0)}
                             
                             {/* Live Pulse Dot */}
                             {isOngoing && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-color)] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent-color)]"></span>
                                </span>
                             )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`truncate max-w-[200px] ${isOngoing ? 'text-[var(--accent-color)] font-bold' : ''}`}>{event.title}</p>
                              {isPending && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded">DRAFT</span>}
                            </div>
                            <p className="text-xs opacity-50 flex items-center gap-1"><MapPin size={10} /> {event.location}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <EventDateDisplay 
                            start={event.date} 
                            end={event.endDate} 
                            startTime={event.time} 
                            endTime={event.endTime} 
                            isOngoing={isOngoing}
                        />
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryStyle(event.category)}`}>
                          {event.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge 
                            status={isPending ? 'Pending' : (isPast ? 'Closed' : event.registrationStatus)} 
                            timingStatus={timingStatus} 
                        />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2  transition-opacity">
                          <button onClick={() => handleClone(event)} className="p-2 text-gray-500 hover:bg-gray-500/10 rounded-lg" title="Duplicate"><Copy size={16} /></button>
                          <button onClick={() => { setSelectedEvent(event); setIsViewOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Eye size={16} /></button>
                          <button onClick={() => { setSelectedEvent(event); setIsFormOpen(true); }} className={`p-2 rounded-lg ${isPending ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-orange-500 hover:bg-orange-500/10'}`}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(event._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        <div className="p-4 border-t border-[var(--border-color)] flex justify-between items-center bg-black/5 dark:bg-white/5">
            <span className="text-sm opacity-60">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-white dark:hover:bg-black disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-white dark:hover:bg-black disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
        </div>
      </div>

      {isFormOpen && <EventFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} eventToEdit={selectedEvent} onSuccess={() => fetchEvents()} />}
      {isViewOpen && selectedEvent && <EventViewModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} event={selectedEvent} />}
    </div>
  );
}