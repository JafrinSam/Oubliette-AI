import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Calendar as CalIcon, LayoutGrid, List, CalendarRange, 
  Trash2, ChevronLeft, ChevronRight, CalendarX, Edit2 
} from 'lucide-react';
import { ScheduleAPI, RjAPI, ShowAPI } from '../../../../services/adminapi';
import ModalPortal from '../../../utils/ModalPortal';
import { toast } from 'sonner';
import { DAYS, HOURS, getMinutes, formatDate } from '../../../../utils/showUtils';

const ScheduleModal = ({ show, onClose, onRefresh }) => {
  const [viewMode, setViewMode] = useState('calendar');
  const [allRjs, setAllRjs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Local State for Schedules (for instant updates)
  const [schedules, setSchedules] = useState(show.weekly_schedules || []);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [exceptionInput, setExceptionInput] = useState('');

  const [newSlot, setNewSlot] = useState({ 
    day: 'Monday', 
    startTime: '', 
    endTime: '', 
    rj: '', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
    exceptionDates: [] 
  });
  
  useEffect(() => { 
    RjAPI.getAll().then(({data}) => setAllRjs(data.data)).catch(console.error); 
  }, []);

  // Sync state when prop changes (e.g. parent refresh)
  useEffect(() => {
    if (show.weekly_schedules) {
      setSchedules(show.weekly_schedules);
    }
  }, [show]);

  // Helper to fetch fresh data from server
  const refreshLocalSchedules = async () => {
    try {
      const { data } = await ShowAPI.getById(show._id); 
      if (data?.data?.weekly_schedules) setSchedules(data.data.weekly_schedules);
    } catch (error) { console.error(error); }
  };

  // --- Date Navigation Logic ---
  const weekDates = useMemo(() => {
    const currentDay = currentDate.getDay(); 
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + distanceToMonday);

    return DAYS.map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { dateObj: date, dayNum: date.getDate() };
    });
  }, [currentDate]);

  const nextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
  const prevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
  const resetToToday = () => setCurrentDate(new Date());

  // --- Exception Handlers ---
  const handleAddException = (e) => {
    e.preventDefault();
    if (!exceptionInput) return;
    if (newSlot.exceptionDates.includes(exceptionInput)) return toast.error("Date already added");
    setNewSlot({ ...newSlot, exceptionDates: [...newSlot.exceptionDates, exceptionInput] });
    setExceptionInput(''); 
  };

  const handleRemoveException = (dateToRemove) => {
    setNewSlot({ ...newSlot, exceptionDates: newSlot.exceptionDates.filter(d => d !== dateToRemove) });
  };

  // --- EDIT Handlers ---
  const handleEdit = (slot) => {
    setEditingId(slot._id);
    setNewSlot({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      rj: slot.rj?._id || slot.rj || '',
      startDate: slot.startDate ? slot.startDate.toString().split('T')[0] : '',
      endDate: slot.endDate ? slot.endDate.toString().split('T')[0] : '',
      exceptionDates: slot.exceptionDates || []
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewSlot({ 
      day: 'Monday', 
      startTime: '', 
      endTime: '', 
      rj: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
      exceptionDates: [] 
    });
    setExceptionInput('');
  };

  // --- Unified Save (Create/Update) ---
  const handleSave = async (e) => { 
    e.preventDefault(); 
    if(!newSlot.startTime || !newSlot.endTime) return toast.error("Time required"); 
    
    setLoading(true);
    try { 
      const payload = { ...newSlot, show: show._id, rj: newSlot.rj || null };
      let savedSlot;

      if (editingId) {
        // UPDATE
        const res = await ScheduleAPI.update(editingId, payload);
        savedSlot = res.data.data;
        // Instant UI Update
        setSchedules(prev => prev.map(s => s._id === editingId ? savedSlot : s));
        toast.success("Updated Successfully");
      } else {
        // CREATE
        const res = await ScheduleAPI.create(payload); 
        savedSlot = res.data.data;
        // Instant UI Update
        setSchedules(prev => [...prev, savedSlot]);
        toast.success("Added Successfully"); 
      }
      
      handleCancelEdit(); 
      if(onRefresh) onRefresh(); 
      await refreshLocalSchedules(); // Ensure fresh populated data

    } catch(e) { 
      console.error(e);
      toast.error(e.response?.data?.message || "Operation failed"); 
    } finally { 
      setLoading(false); 
    } 
  };

  // --- Delete Handler ---
  const handleDelete = async (id) => { 
    if(confirm('Are you sure you want to delete this rule?')) { 
      try {
        await ScheduleAPI.delete(id); 
        // Instant UI Update
        setSchedules(prev => prev.filter(s => s._id !== id));
        toast.success("Deleted");
        
        if(editingId === id) handleCancelEdit();
        if(onRefresh) onRefresh();
      } catch (e) {
        toast.error("Failed to delete");
      }
    } 
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CalIcon size={24} style={{ color: 'var(--accent-color)' }}/> Schedule Manager
              </h2>
              <p className="text-sm font-bold ml-8 opacity-70" style={{ color: 'var(--text-secondary)' }}>{show.title}</p>
            </div>
            <div className="flex p-1 rounded-lg border gap-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => setViewMode('calendar')} className="p-2 rounded" style={{ backgroundColor: viewMode === 'calendar' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-primary)' }}><LayoutGrid size={18}/></button>
              <button onClick={() => setViewMode('list')} className="p-2 rounded" style={{ backgroundColor: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-primary)' }}><List size={18}/></button>
              <div className="w-[1px] mx-1" style={{ backgroundColor: 'var(--border-color)' }}></div>
              <button onClick={onClose} className="p-2 rounded hover:opacity-70" style={{ color: 'var(--text-secondary)' }}><X size={18}/></button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
            
            {/* --- LEFT: FORM --- */}
            <div className="lg:w-1/3 p-5 rounded-2xl border h-fit flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  {editingId ? <><Edit2 size={16}/> Edit Rule</> : <><Plus size={16}/> New Rule</>}
                </h3>
                {editingId && (
                  <button onClick={handleCancelEdit} className="text-[10px] underline hover:text-red-500" style={{ color: 'var(--text-secondary)' }}>Cancel Edit</button>
                )}
              </div>
              
              <form onSubmit={handleSave} className="space-y-4">
                {/* Time & Day */}
                <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Time Slots</p>
                  <select className="w-full rounded-lg p-2 text-sm outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={newSlot.day} onChange={e => setNewSlot({...newSlot, day: e.target.value})}>{DAYS.map(d=> <option key={d} value={d}>{d}</option>)}</select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" className="rounded-lg p-2 text-sm outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} required />
                    <input type="time" className="rounded-lg p-2 text-sm outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} required />
                  </div>
                </div>
                
                {/* Validity */}
                <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <p className="text-[10px] font-bold uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><CalendarRange size={10}/> Effective Range</p>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]">Start Date</label>
                      <input type="date" className="w-full rounded-lg p-2 text-xs outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={newSlot.startDate} onChange={e => setNewSlot({...newSlot, startDate: e.target.value})} required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]">End Date</label>
                      <input type="date" className="w-full rounded-lg p-2 text-xs outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={newSlot.endDate} onChange={e => setNewSlot({...newSlot, endDate: e.target.value})} required />
                    </div>
                  </div>
                </div>

                {/* Exceptions */}
                <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <p className="text-[10px] font-bold uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><CalendarX size={10}/> Skip Dates (Exceptions)</p>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 rounded-lg p-2 text-xs outline-none border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} value={exceptionInput} onChange={e => setExceptionInput(e.target.value)} />
                    <button type="button" onClick={handleAddException} className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-white transition-colors" style={{ color: 'var(--text-primary)' }}>Add</button>
                  </div>
                  {newSlot.exceptionDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                      {newSlot.exceptionDates.map(date => (
                        <div key={date} className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                          <span>{date}</span>
                          <button type="button" onClick={() => handleRemoveException(date)} className="hover:text-red-500"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {editingId && <button type="button" onClick={handleCancelEdit} className="w-1/3 font-bold py-3 rounded-xl border hover:opacity-70 text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-color)' }}>Cancel</button>}
                  <button type="submit" disabled={loading} className="flex-1 font-bold py-3 rounded-xl shadow-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--accent-color)' }}>
                    {loading ? 'Saving...' : (editingId ? 'Update Rule' : 'Add Rule')}
                  </button>
                </div>
              </form>
            </div>

            {/* --- RIGHT: CALENDAR/LIST VIEW --- */}
            <div className="lg:w-2/3 flex-1 min-h-[400px]">
              
              {/* Date Nav */}
              {viewMode === 'calendar' && (
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <button onClick={prevWeek} className="p-1.5 rounded-lg border hover:bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><ChevronLeft size={16}/></button>
                    <button onClick={nextWeek} className="p-1.5 rounded-lg border hover:bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><ChevronRight size={16}/></button>
                    <button onClick={resetToToday} className="px-3 py-1.5 text-xs font-bold rounded-lg border hover:bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Today</button>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{weekDates[0].dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                </div>
              )}

              {/* CALENDAR VIEW */}
              {viewMode === 'calendar' ? (
                <div className="h-[500px] border rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      {DAYS.map((d, i) => (
                        <div key={d} className="flex-1 p-2 text-center border-r" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="text-[10px] font-bold uppercase opacity-60" style={{ color: 'var(--text-secondary)' }}>{d.substring(0,3)}</div>
                          <div className={`text-sm font-bold ${new Date().toDateString() === weekDates[i].dateObj.toDateString() ? 'text-[var(--accent-color)]' : ''}`} style={{ color: new Date().toDateString() === weekDates[i].dateObj.toDateString() ? 'var(--accent-color)' : 'var(--text-primary)' }}>{weekDates[i].dayNum}</div>
                        </div>
                      ))}
                    </div>
                    {/* Grid */}
                    <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                      <div className="flex h-[1440px] relative">
                        {DAYS.map((d) => (
                          <div key={d} className="flex-1 border-r relative" style={{ borderColor: 'var(--border-color)' }}>
                            {HOURS.map(h => <div key={h} className="h-[60px] border-b w-full" style={{ borderColor: 'var(--border-color)', opacity: 0.3 }}/>)}
                            
                            {/* Calendar Items */}
                            {schedules.filter(s => s.day === d).map(slot => { 
                              const start = getMinutes(slot.startTime); 
                              return (
                                <div 
                                  key={slot._id} 
                                  onClick={() => handleEdit(slot)} 
                                  className="absolute inset-x-1 rounded p-1 text-[10px] text-white font-bold text-center border shadow-lg cursor-pointer transition-colors group flex flex-col justify-center items-center hover:brightness-110" 
                                  style={{ top: `${start}px`, height: `${getMinutes(slot.endTime) - start}px`, backgroundColor: 'var(--accent-color)', borderColor: 'rgba(255,255,255,0.2)', opacity: editingId === slot._id ? 0.6 : 1 }}
                                >
                                  <span>{slot.startTime}</span>
                                  
                                  {/* Delete Icon (Top Right) */}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(slot._id); }} 
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/20 hover:bg-red-500 text-white"
                                    title="Delete Rule"
                                  >
                                    <Trash2 size={10}/>
                                  </button>

                                  {/* Edit Icon (Bottom Center) */}
                                  <div className="absolute bottom-1 flex items-center gap-1 opacity-80 bg-black/20 px-1.5 py-0.5 rounded-full">
                                     <Edit2 size={8}/> <span className="text-[8px]">Edit</span>
                                  </div>
                                </div>
                              ) 
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIST VIEW */
                <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar">
                  {schedules.map(slot => (
                    <div key={slot._id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${editingId === slot._id ? 'border-[var(--accent-color)] bg-[var(--bg-primary)] shadow-md' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'}`}>
                      <div className="flex items-center gap-4">
                        <div className="font-bold px-3 py-1 rounded-lg text-sm w-24 text-center text-white" style={{ backgroundColor: 'var(--accent-color)' }}>{slot.day}</div>
                        <div>
                          <span className="font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{slot.startTime} - {slot.endTime}</span>
                          <div className="text-[10px] mt-1 flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1"><CalendarRange size={10}/> {formatDate(slot.startDate)} — {formatDate(slot.endDate)}</span>
                            {slot.exceptionDates?.length > 0 && <span className="flex items-center gap-1 text-red-400"><CalendarX size={10}/> {slot.exceptionDates.length} Exceptions</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* ACTIONS (Always Visible) */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(slot)} 
                          className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-colors" 
                          style={{ color: 'var(--text-primary)' }} 
                          title="Edit"
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(slot._id)} 
                          className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-red-500 hover:text-red-500 transition-colors" 
                          style={{ color: 'var(--danger-color)' }} 
                          title="Delete"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {schedules.length === 0 && <div className="text-center p-10 text-sm" style={{ color: 'var(--text-secondary)' }}>No schedules yet.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ScheduleModal;