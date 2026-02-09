import React, { useState, useEffect } from 'react';
import { X, ImageIcon, FileText, CheckCircle, UploadCloud, Plus, Trash2, RefreshCcw, Settings, Star } from 'lucide-react';
import { toast } from 'sonner';
import useFetch from '../../../hooks/useFetch';
import ModalPortal from '../../utils/ModalPortal';
import { useTheme } from '../../../context/ThemeContext';
import MDEditor from '@uiw/react-md-editor';

export default function EventFormModal({ isOpen, onClose, eventToEdit, onSuccess }) {
  const { themeName } = useTheme();
  const { post, put, loading } = useFetch();

  const [activeTab, setActiveTab] = useState('details');
  const [eventId, setEventId] = useState(null);
  
  // Thumbnail State
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    title: '', description: '', summary: '', category: 'Academic',
    date: '', time: '',
    endDate: '', endTime: '',
    location: '',
    registrationStatus: 'Open', 
    registrationLink: '',
    registrationStartDate: '', 
    registrationEndDate: '',
    capacity: 0,
    isFeatured: false, // ✅ Added
    organizers: [{ name: '', role: 'Student', email: '', phone: '' }]
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setEventId(eventToEdit._id);
        const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
        
        setFormData({
          ...eventToEdit,
          date: formatDate(eventToEdit.date),
          endDate: formatDate(eventToEdit.endDate),
          endTime: eventToEdit.endTime || '',
          registrationStartDate: formatDate(eventToEdit.registrationStartDate),
          registrationEndDate: formatDate(eventToEdit.registrationEndDate),
          organizers: eventToEdit.organizers?.length ? eventToEdit.organizers : [{ name: '', role: 'Student', email: '', phone: '' }]
        });

        if (eventToEdit.creationStatus !== 'pending' && !eventToEdit.thumbnail.includes('default-event.jpg')) {
            setPreviewUrl(eventToEdit.thumbnail);
        } else {
            setPreviewUrl('');
        }

        if (eventToEdit.creationStatus === 'pending') {
          setActiveTab('thumbnail');
        } else {
          setActiveTab('details');
        }
      } else {
        resetForm();
        setActiveTab('details');
      }
    }
  }, [isOpen, eventToEdit]);

  const resetForm = () => {
    setEventId(null);
    setThumbnailFile(null);
    setPreviewUrl('');
    setFormData({
      title: '', description: '', summary: '', category: 'Academic',
      date: '', time: '',
      endDate: '', endTime: '',
      location: '',
      registrationStatus: 'Open', 
      registrationLink: '',
      registrationStartDate: '', 
      registrationEndDate: '',
      capacity: 0,
      isFeatured: false,
      organizers: [{ name: '', role: 'Student', email: '', phone: '' }]
    });
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleDescriptionChange = (value) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleOrganizerChange = (index, field, value) => {
    const newOrganizers = [...formData.organizers];
    newOrganizers[index][field] = value;
    setFormData(prev => ({ ...prev, organizers: newOrganizers }));
  };

  const addOrganizer = () => {
    setFormData(prev => ({
      ...prev,
      organizers: [...prev.organizers, { name: '', role: 'Student', email: '', phone: '' }]
    }));
  };

  const removeOrganizer = (index) => {
    if (formData.organizers.length === 1) return toast.warning("At least one organizer is required.");
    setFormData(prev => ({ ...prev, organizers: prev.organizers.filter((_, i) => i !== index) }));
  };

  // --- SUBMIT: STEP 1 ---
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    
    const validOrganizers = formData.organizers.filter(org => org.name.trim() !== '');
    if (validOrganizers.length === 0) return toast.error("Please add at least one valid organizer name.");

    const payload = { 
        ...formData, 
        organizers: validOrganizers,
        endDate: formData.endDate ? formData.endDate : undefined,
        endTime: formData.endTime ? formData.endTime : undefined,
        registrationStartDate: formData.registrationStartDate ? formData.registrationStartDate : undefined,
        registrationEndDate: formData.registrationEndDate ? formData.registrationEndDate : undefined,
        capacity: Number(formData.capacity) || 0,
        isFeatured: formData.isFeatured || false
    };

    let response;
    if (eventId) {
      response = await put(`/events/${eventId}`, payload, { successMessage: "Details updated!" });
    } else {
      response = await post('/events', payload, { successMessage: "Draft created! Upload a flyer next." });
    }

    if (response.success) {
      if (!eventId && response.data?.data?._id) setEventId(response.data.data._id);
      else if (!eventId && response.data?._id) setEventId(response.data._id);

      if (!eventToEdit) setActiveTab('thumbnail');
      else { onSuccess(); onClose(); }
    }
  };

  // --- HANDLERS: THUMBNAIL ---
  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return toast.error("Only image files are allowed.");
    if (file.size > 5 * 1024 * 1024) return toast.error("File is too large (Max 5MB)");
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleThumbnailSubmit = async () => {
    if (!thumbnailFile && !previewUrl) return toast.error("Please select a flyer/poster.");
    if (!thumbnailFile && previewUrl) {
       toast.info("No changes made to image");
       onClose();
       return;
    }

    const data = new FormData();
    data.append('thumbnail', thumbnailFile);

    const response = await put(`/events/${eventId}/thumbnail`, data, {
        successMessage: eventToEdit ? "Thumbnail updated!" : "Event Published Successfully!"
    });

    if (response.success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  const isPending = eventToEdit?.creationStatus === 'pending';
  const isCreateFlow = !eventToEdit || isPending;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          
          {/* HEADER */}
          <div className="flex flex-col border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-2xl">
            <div className="flex justify-between items-center p-5">
               <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {eventToEdit ? (isPending ? 'Complete Your Event' : 'Edit Event') : 'Create New Event'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                     {activeTab === 'details' ? 'Step 1: Event Details' : 'Step 2: Upload Flyer'}
                  </p>
               </div>
               <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><X size={20}/></button>
            </div>

            {(eventId && !isPending) && (
              <div className="flex px-5 gap-6">
                <button onClick={() => setActiveTab('details')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent text-[var(--text-secondary)] opacity-60'}`}>
                  <FileText size={16}/> Edit Details
                </button>
                <button onClick={() => setActiveTab('thumbnail')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'thumbnail' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent text-[var(--text-secondary)] opacity-60'}`}>
                  <ImageIcon size={16}/> Edit Flyer
                </button>
              </div>
            )}
            
            {isCreateFlow && (
               <div className="w-full h-1 bg-[var(--border-color)]">
                  <div className="h-full bg-[var(--accent-color)] transition-all duration-300" style={{ width: activeTab === 'details' ? '50%' : '100%' }} />
               </div>
            )}
          </div>

          {/* BODY CONTENT */}
          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar bg-[var(--bg-card)]">
            
            {/* === TAB 1: DETAILS === */}
            <div className={activeTab === 'details' ? 'block' : 'hidden'}>
              <form id="eventForm" onSubmit={handleDetailsSubmit} className="space-y-6">
                
                {/* --- BASIC INFO --- */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="label text-[var(--text-secondary)]">Event Title *</label>
                        <input required name="title" value={formData.title} onChange={handleChange} className="input text-[var(--text-primary)]" placeholder="e.g. AI Tech Summit 2026" />
                    </div>
                    <div className="col-span-2">
                        <label className="label text-[var(--text-secondary)]">Short Summary *</label>
                        <input required name="summary" value={formData.summary} onChange={handleChange} className="input text-[var(--text-primary)]" maxLength={200} placeholder="Brief one-liner for cards..." />
                    </div>
                    <div>
                        <label className="label text-[var(--text-secondary)]">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="input text-[var(--text-primary)]">
                            {['Tech', 'Cultural', 'Academic', 'Sports', 'Workshop'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label text-[var(--text-secondary)]">Location *</label>
                        <input required name="location" value={formData.location} onChange={handleChange} className="input text-[var(--text-primary)]" placeholder="e.g. Auditorium A" />
                    </div>
                </div>

                {/* --- SCHEDULE --- */}
                <div className="col-span-2 grid grid-cols-2 gap-4 border border-[var(--border-color)] p-4 rounded-xl bg-[var(--bg-secondary)]">
                    <p className="col-span-2 text-sm font-bold text-[var(--text-secondary)] opacity-70">Event Schedule</p>
                    <div>
                        <label className="label text-[var(--text-secondary)]">Start Date *</label>
                        <input type="date" required name="date" value={formData.date} onChange={handleChange} className="input text-[var(--text-primary)]" />
                    </div>
                    <div>
                        <label className="label text-[var(--text-secondary)]">Start Time *</label>
                        <input type="time" required name="time" value={formData.time} onChange={handleChange} className="input text-[var(--text-primary)]" />
                    </div>
                    <div>
                        <label className="label text-[var(--text-secondary)]">End Date <span className="opacity-50 font-normal">(Optional)</span></label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input text-[var(--text-primary)]" min={formData.date} />
                    </div>
                    <div>
                        <label className="label text-[var(--text-secondary)]">End Time <span className="opacity-50 font-normal">(Optional)</span></label>
                        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input text-[var(--text-primary)]" />
                    </div>
                </div>

                {/* ✅ REGISTRATION & SETTINGS (NEW SECTION) */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border border-[var(--border-color)] p-4 rounded-xl bg-[var(--bg-secondary)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-color)] opacity-50"></div>
                    <div className="col-span-2 flex justify-between items-center pb-2 border-b border-[var(--border-color)] mb-2">
                        <p className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2">
                            <Settings size={16} /> Registration & Settings
                        </p>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[var(--accent-color)] hover:opacity-80">
                            <input 
                                type="checkbox" 
                                name="isFeatured" 
                                checked={formData.isFeatured} 
                                onChange={handleChange} 
                                className="accent-[var(--accent-color)] w-4 h-4"
                            />
                            <Star size={14} fill={formData.isFeatured ? "currentColor" : "none"} /> Mark as Featured
                        </label>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="label text-[var(--text-secondary)]">Registration Status</label>
                        <select name="registrationStatus" value={formData.registrationStatus} onChange={handleChange} className="input text-[var(--text-primary)]">
                            {['Open', 'Closed', 'Filling Fast', 'Waitlist', 'Coming Soon'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Capacity */}
                    <div>
                        <label className="label text-[var(--text-secondary)]">Capacity <span className="opacity-50 font-normal">(0 = Unlimited)</span></label>
                        <input type="number" name="capacity" min="0" value={formData.capacity} onChange={handleChange} className="input text-[var(--text-primary)]" placeholder="e.g. 100" />
                    </div>

                    {/* Link */}
                    <div className="col-span-2">
                        <label className="label text-[var(--text-secondary)]">Registration Link <span className="opacity-50 font-normal">(Optional)</span></label>
                        <input type="url" name="registrationLink" value={formData.registrationLink} onChange={handleChange} className="input text-[var(--text-primary)]" placeholder="https://forms.google.com/..." />
                    </div>
                </div>

                {/* --- DESCRIPTION --- */}
                <div data-color-mode={themeName === 'dark' ? 'dark' : 'light'}>
                    <label className="label mb-2 text-[var(--text-secondary)]">Full Description</label>
                    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                        <MDEditor value={formData.description} onChange={handleDescriptionChange} height={300} preview="edit" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                </div>
                
                {/* --- ORGANIZERS --- */}
                <div className="border-t border-[var(--border-color)] pt-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-bold text-[var(--text-primary)]">Organizers</label>
                        <button type="button" onClick={addOrganizer} className="text-sm font-bold text-[var(--accent-color)] flex items-center gap-1 hover:underline px-3 py-1.5 rounded-lg hover:bg-[var(--accent-color)]/10 transition-colors">
                            <Plus size={16} /> Add Organizer
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.organizers.map((org, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-3 items-start bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                    <div><label className="sub-label text-[var(--text-secondary)]">Name *</label><input placeholder="John Doe" value={org.name} onChange={(e) => handleOrganizerChange(index, 'name', e.target.value)} className="input text-[var(--text-primary)] w-full text-sm" required /></div>
                                    <div>
                                        <label className="sub-label text-[var(--text-secondary)]">Role</label>
                                        <select value={org.role} onChange={(e) => handleOrganizerChange(index, 'role', e.target.value)} className="input text-[var(--text-primary)] w-full text-sm">
                                            {['Student', 'Professor', 'External'].map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="sub-label text-[var(--text-secondary)]">Email</label><input type="email" value={org.email} onChange={(e) => handleOrganizerChange(index, 'email', e.target.value)} className="input text-[var(--text-primary)] w-full text-sm" /></div>
                                    <div><label className="sub-label text-[var(--text-secondary)]">Phone</label><input type="tel" value={org.phone} onChange={(e) => handleOrganizerChange(index, 'phone', e.target.value)} className="input text-[var(--text-primary)] w-full text-sm" /></div>
                                </div>
                                <button type="button" onClick={() => removeOrganizer(index)} className="mt-6 md:mt-1 p-2 text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
              </form>
            </div>

            {/* === TAB 2: THUMBNAIL UPLOAD === */}
            <div className={`h-full flex flex-col items-center justify-center space-y-6 ${activeTab === 'thumbnail' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}`}>
                {/* ... (Existing Thumbnail Code - No Changes Needed Here) ... */}
                {/* Just re-pasting for completeness if you copy-paste the whole file */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Upload Event Flyer</h3>
                    <p className="text-sm text-[var(--text-secondary)] opacity-80 max-w-md mx-auto">
                        Upload a vertical flyer for best results. <br/>
                        <strong>Recommended:</strong> Portrait (3:4 or A4), Max 5MB.
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <label 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleDrop}
                        className={`relative group flex flex-col items-center justify-center w-full h-[450px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden bg-[var(--bg-secondary)]
                        ${isDragging 
                            ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 scale-[1.02]' 
                            : (previewUrl ? 'border-[var(--accent-color)]' : 'border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-black/5 dark:hover:bg-white/5')
                        }`}
                    >
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain z-10" />
                                <div className="absolute inset-0 z-0 opacity-30 blur-xl" style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                     <div className="flex gap-3">
                                         <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xl">
                                             <RefreshCcw size={16}/> Change
                                         </span>
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[var(--text-secondary)] pointer-events-none p-6 text-center">
                                <UploadCloud size={48} className={`mb-3 transition-opacity ${isDragging ? 'text-[var(--accent-color)] opacity-100' : 'opacity-50'}`} />
                                <p className="mb-2 text-sm">
                                    <span className="font-semibold text-[var(--text-primary)]">{isDragging ? 'Drop Flyer Here' : 'Click to upload'}</span> 
                                    {!isDragging && ' or drag and drop'}
                                </p>
                                <p className="text-xs opacity-50">Vertical (Portrait) Images look best</p>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </label>
                    
                    {previewUrl && (
                        <button onClick={(e) => { e.preventDefault(); setPreviewUrl(''); setThumbnailFile(null); }} className="mt-3 text-xs text-[var(--danger-color)] hover:underline w-full text-center">
                            Remove Image
                        </button>
                    )}
                </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-6 border-t border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)] rounded-b-2xl">
            {activeTab === 'thumbnail' && isCreateFlow ? (
                <button type="button" onClick={() => setActiveTab('details')} className="px-6 py-2.5 rounded-xl border border-[var(--border-color)] font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  Back to Details
                </button>
            ) : (
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-[var(--border-color)] font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
            )}

            {activeTab === 'details' ? (
                <button type="submit" form="eventForm" disabled={loading} className="px-8 py-2.5 rounded-xl bg-[var(--accent-color)] text-white font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-color)]/20 disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Saving...' : (eventToEdit && !isPending ? 'Update Details' : 'Next Step')}
                </button>
            ) : (
                <button type="button" onClick={handleThumbnailSubmit} disabled={loading} className="px-8 py-2.5 rounded-xl bg-[var(--accent-color)] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-color)]/20 disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Uploading...' : (isCreateFlow ? 'Publish Event' : 'Update Thumbnail')} <CheckCircle size={18}/>
                </button>
            )}
          </div>

        </div>
        <style>{`
          .label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; opacity: 0.9; }
          .sub-label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.25rem; opacity: 0.7; }
          .input { width: 100%; padding: 0.75rem; border-radius: 0.75rem; background-color: var(--bg-primary); border: 1px solid var(--border-color); outline: none; transition: all; }
          .input:focus { border-color: var(--accent-color); ring: 2px solid var(--accent-color); }
        `}</style>
      </div>
    </ModalPortal>
  );
}