import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { scheduleApi } from '../services/scheduleApi';
import { assetApi } from '../services/assetApi'; 
import toast, { Toaster } from 'react-hot-toast';
import { 
  CalendarClock, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  X, 
  Filter, 
  Music,
  Clock,
  CalendarDays,
  AlertTriangle,
  RefreshCw // New Import
} from 'lucide-react';

// --- Helper: Schedule Row ---
const ScheduleRow = ({ schedule, onDeleteClick, onEdit }) => {
  const timeDisplay = `${String(schedule.localHour).padStart(2, '0')}:${String(schedule.localMinute).padStart(2, '0')}`;
  
  const isPast = new Date(schedule.scheduledTime) < new Date();
  const rowOpacity = isPast && schedule.isPlayed ? "opacity-50 grayscale" : "opacity-100";

  return (
    <tr className={`border-b border-border hover:bg-surface transition-all duration-150 group ${rowOpacity}`}>
      <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
        <CalendarDays size={16} className="text-secondary" />
        {schedule.localDate}
      </td>
      <td className="px-6 py-4 font-mono font-bold text-accent">
        <div className="flex items-center gap-2">
            <Clock size={16} />
            {timeDisplay}
        </div>
      </td>
      <td className="px-6 py-4 text-primary font-medium break-all">
        {schedule.filename}
      </td>
      <td className="px-6 py-4 text-xs">
        {schedule.isPlayed ? (
            <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-full font-bold">Played</span>
        ) : (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full font-bold">Pending</span>
        )}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
        <div className="flex justify-end gap-2">
          {!isPast && (
            <button 
                onClick={() => onEdit(schedule)}
                className="p-2 text-secondary hover:text-accent hover:bg-background rounded-full transition-colors"
                title="Edit Schedule"
            >
                <Edit2 size={18} />
            </button>
          )}
          <button 
            onClick={() => onDeleteClick(schedule._id)}
            className="p-2 text-secondary hover:text-red-500 hover:bg-background rounded-full transition-colors"
            title="Delete Schedule"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Main Component ---
export default function SchedulerView() {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- DELETE MODAL STATE ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scheduleId: null
  });

  const today = new Date().toISOString().split('T')[0];

  const [formState, setFormState] = useState({ 
    _id: null, 
    date: today,
    hour: '12', 
    minute: '00', 
    filename: '' 
  });
  
  const [filterType, setFilterType] = useState('All'); 
  const isEditing = !!formState._id;

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    // Only show loading spinner on initial load or manual refresh, not auto-refresh
    if (!isAutoRefresh) setLoading(true);
    
    try {
      const [schedulesData, assetsData] = await Promise.all([
        scheduleApi.getAll(),
        assetApi.getAll()
      ]);
      setSchedules(schedulesData);
      // Only set assets if they changed (optional optimization) to avoid re-renders
      setAssets(assetsData); 
      
      if (!isAutoRefresh && loading) toast.success("List refreshed");
    } catch (err) {
      console.error(err);
      if (!isAutoRefresh) toast.error("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []); // Remove 'loading' from dependency to avoid loop

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 1. AUTO REFRESH (Every 30 Seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // true = silent refresh (no loading spinner)
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredAssets = useMemo(() => {
    if (filterType === 'All') return assets;
    return assets.filter(asset => asset.type === filterType);
  }, [assets, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hour = parseInt(formState.hour);
    const minute = parseInt(formState.minute);
    const filename = formState.filename.trim();
    const date = formState.date;

    if (!date) return toast.error("Please select a date.");
    if (isNaN(hour) || hour < 0 || hour > 23) return toast.error("Hour must be between 0 and 23.");
    if (isNaN(minute) || minute < 0 || minute > 59) return toast.error("Minute must be between 0 and 59.");
    if (!filename) return toast.error("Please select a file.");

    const payload = { date, hour, minute, filename };
    
    const apiCall = isEditing 
      ? scheduleApi.update(formState._id, payload)
      : scheduleApi.create(payload);

    toast.promise(apiCall, {
      loading: isEditing ? 'Updating schedule...' : 'Scheduling event...',
      success: (data) => {
        handleCancelEdit();
        fetchData(); 
        return data.message || (isEditing ? 'Schedule updated successfully!' : 'Track scheduled successfully!');
      },
      error: (err) => {
        const msg = err.response?.data?.message || err.message || "Operation failed";
        return `Error: ${msg}`;
      }
    });
  };
  
  const handleEdit = (schedule) => {
    setFormState({
        _id: schedule._id,
        date: schedule.localDate,
        hour: String(schedule.localHour).padStart(2, '0'),
        minute: String(schedule.localMinute).padStart(2, '0'),
        filename: schedule.filename
    });
    const foundAsset = assets.find(a => a.filename === schedule.filename);
    if (foundAsset) setFilterType(foundAsset.type || 'All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormState({ _id: null, date: today, hour: '12', minute: '00', filename: '' });
    setFilterType('All');
  };

  const promptDelete = (id) => {
    setDeleteModal({ isOpen: true, scheduleId: id });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, scheduleId: null });
  };

  const confirmDelete = async () => {
    if (!deleteModal.scheduleId) return;

    const idToDelete = deleteModal.scheduleId;
    setDeleteModal({ isOpen: false, scheduleId: null });

    toast.promise(scheduleApi.delete(idToDelete), {
      loading: 'Deleting...',
      success: () => {
        fetchData();
        return 'Event removed from schedule.';
      },
      error: (err) => {
         const msg = err.response?.data?.message || err.message;
         return `Failed to delete: ${msg}`;
      }
    });
  };

  // 2. Manual Refresh Handler
  const handleManualRefresh = () => {
    fetchData(false); // false = show loading spinner
  };

  return (
    <div className="min-h-full p-8 bg-background text-primary transition-colors duration-300 relative">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
      
      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-500/10 rounded-full mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Confirm Deletion</h3>
              <p className="text-secondary text-sm mb-6">
                Are you sure you want to remove this event from the schedule? This action cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-accent flex items-center gap-3">
          <CalendarClock size={32} />
          Scheduler Manager
        </h1>
        {loading && <div className="text-accent animate-pulse font-medium text-sm">Syncing...</div>}
      </div>

      {/* --- Add/Edit Form --- */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-lg mb-10 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
            {isEditing ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
            {isEditing ? 'Edit Scheduled Event' : 'Add New Event'}
            </h2>
            {isEditing && <span className="text-xs text-secondary bg-surface px-2 py-1 rounded">Editing Mode</span>}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium text-secondary mb-1 flex items-center gap-1">
                <CalendarDays size={14} /> Date
            </label>
            <input 
              type="date" 
              required
              value={formState.date} 
              onChange={(e) => setFormState(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none"
            />
          </div>

          <div className="col-span-6 md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Hour (0-23)</label>
            <input 
              type="number" min="0" max="23" required
              value={formState.hour} 
              onChange={(e) => setFormState(p => ({ ...p, hour: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none"
              placeholder="HH"
            />
          </div>
          
          <div className="col-span-6 md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Minute (0-59)</label>
            <input 
              type="number" min="0" max="59" required
              value={formState.minute} 
              onChange={(e) => setFormState(p => ({ ...p, minute: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none"
              placeholder="MM"
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium text-secondary mb-1 flex items-center gap-1">
              <Filter size={12} /> Filter Library
            </label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Music">Music</option>
              <option value="Jingle">Jingles</option>
              <option value="StationID">Station IDs</option>
              <option value="Ad">Advertisements</option>
              <option value="Prerecorded Show">Prerecorded Show</option>
            </select>
          </div>
          
          <div className="col-span-12">
            <label className="block text-sm font-medium text-secondary mb-1 flex items-center gap-1">
               <Music size={12} /> Select Track ({filteredAssets.length})
            </label>
            <select 
              required
              value={formState.filename} 
              onChange={(e) => setFormState(p => ({ ...p, filename: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none cursor-pointer"
            >
              <option value="">-- Select a file --</option>
              {filteredAssets.map(asset => (
                <option key={asset._id} value={asset.filename}>
                  {asset.title || asset.filename} {asset.artist !== 'Unknown' ? `by ${asset.artist}` : ''}
                </option>
              ))}
            </select>
            {assets.length === 0 && (
                <p className="text-xs text-red-400 mt-1">No files found. Go to Music Library to upload.</p>
            )}
          </div>
          
          <div className="col-span-12 flex space-x-3 mt-4">
            <button 
              type="submit" disabled={loading}
              className="flex items-center gap-2 font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform active:scale-95 bg-accent hover:bg-accent-hover text-white"
            >
              <Save size={18} />
              {isEditing ? 'Save Changes' : 'Schedule Event'}
            </button>
            {isEditing && (
              <button 
                type="button" onClick={handleCancelEdit} disabled={loading}
                className="flex items-center gap-2 bg-surface border border-border text-secondary hover:text-primary font-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- Schedule List Table --- */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-lg transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Scheduled Events ({schedules.length})</h2>
            
            {/* 3. REFRESH BUTTON */}
            <button 
              onClick={handleManualRefresh}
              className="p-2 text-secondary hover:text-accent transition-colors bg-surface border border-border rounded-full hover:bg-background"
              title="Refresh List"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
        
        <div className="overflow-x-auto relative rounded-lg border border-border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-surface text-secondary border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Track Name</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-secondary italic">
                    No events scheduled. Add a track above to start automation.
                  </td>
                </tr>
              ) : (
                schedules.map(schedule => (
                  <ScheduleRow 
                    key={schedule._id} 
                    schedule={schedule} 
                    onDeleteClick={promptDelete} // Pass the Modal Opener here
                    onEdit={handleEdit} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}