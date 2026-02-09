import React, { useState, useEffect, useCallback } from 'react';
import { RjAPI } from '../../services/adminapi';
import { 
  Plus, Trash2, Edit2, X, Upload, Search, 
  Instagram, Loader2, Check, ZoomIn, RotateCcw, 
  MoreHorizontal, Mic2 
} from 'lucide-react';
import ModalPortal from '../../components/utils/ModalPortal';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';

// --- SUB-COMPONENT: SKELETON CARD ---
const RjSkeleton = () => (
  <div className="rounded-2xl border bg-[var(--bg-card)] overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
    <div className="aspect-square bg-[var(--bg-secondary)] animate-pulse" />
    <div className="p-5 space-y-3">
      <div className="h-6 bg-[var(--bg-secondary)] rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2 animate-pulse" />
      <div className="pt-4 flex justify-between items-center border-t border-[var(--border-color)]">
        <div className="h-6 w-20 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// --- SUB-COMPONENT: INITIALS AVATAR ---
const InitialsAvatar = ({ name }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  // Generate consistent pastel color based on name length
  const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-orange-100 text-orange-600'];
  const colorClass = colors[name.length % colors.length];

  return (
    <div className={`w-full h-full flex items-center justify-center text-4xl font-bold ${colorClass}`}>
      {initials}
    </div>
  );
};

export default function RjManager() {
  const [rjs, setRjs] = useState([]);
  const [filteredRjs, setFilteredRjs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRj, setEditingRj] = useState(null);
  const [formData, setFormData] = useState({ name: '', bio: '', instagram: '' });
  
  // Image & Crop State
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => { loadRjs(); }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredRjs(rjs.filter(rj => 
      rj.name.toLowerCase().includes(lowerSearch) || 
      rj.bio?.toLowerCase().includes(lowerSearch)
    ));
  }, [search, rjs]);

  const loadRjs = async () => {
    setLoading(true);
    try {
      const { data } = await RjAPI.getAll();
      setRjs(data.data);
    } catch (err) { toast.error("Failed to load RJs"); } finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setIsCropping(true);
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "rj_profile.jpg", { type: "image/jpeg" });
      setFiles([croppedFile]);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setIsCropping(false);
      toast.success("Photo ready");
    } catch (e) { toast.error("Crop failed"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRj) {
        await RjAPI.update(editingRj._id, { ...formData, replacePhotos: files.length > 0 ? 'true' : 'false' }, files);
        toast.success("Updated Successfully");
      } else {
        await RjAPI.create(formData, files);
        toast.success("Created Successfully");
      }
      setIsFormOpen(false);
      resetForm();
      loadRjs();
    } catch (err) { toast.error(err.response?.data?.message || "Error saving"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this RJ profile permanently?")) {
      try { await RjAPI.delete(id); toast.success("Deleted"); loadRjs(); } 
      catch (e) { toast.error("Failed to delete"); }
    }
  };

  const openEdit = (rj) => {
    setEditingRj(rj);
    setFormData({ name: rj.name, bio: rj.bio, instagram: rj.instagram });
    setPreviewUrl(rj.photo?.[0] || null);
    setFiles([]);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingRj(null);
    setFormData({ name: '', bio: '', instagram: '' });
    setFiles([]);
    setPreviewUrl(null);
    setImageSrc(null);
    setIsCropping(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>RJ Management</h1>
          <p className="mt-2 text-sm opacity-70" style={{ color: 'var(--text-secondary)' }}>Manage hosts, personalities, and assignments.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} style={{ color: 'var(--text-primary)' }}/>
            <input 
              type="text" placeholder="Search RJs..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none border focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-all"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-[var(--accent-color)]/20 hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: 'var(--accent-color)' }}>
            <Plus size={20} /> <span className="hidden md:inline">Add RJ</span>
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && [1,2,3,4].map(i => <RjSkeleton key={i} />)}
        
        {!loading && filteredRjs.map((rj) => (
          <div key={rj._id} className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-color)' }}>
            
            {/* Image Area - Square */}
            <div className="relative aspect-square w-full overflow-hidden border-b" style={{ borderColor: 'var(--border-color)' }}>
              {rj.photo?.[0] ? (
                <img src={rj.photo[0]} alt={rj.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
              ) : (
                <InitialsAvatar name={rj.name} />
              )}
              {/* Subtle Gradient Overlay for Text Readability if needed later */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            
            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold truncate pr-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{rj.name}</h3>
                {rj.instagram && (
                  <a href={`https://instagram.com/${rj.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-pink-500 hover:text-pink-600 p-1 rounded-full hover:bg-pink-50 transition-colors">
                    <Instagram size={16}/>
                  </a>
                )}
              </div>
              
              <p className="text-sm line-clamp-2 leading-relaxed opacity-70 mb-4" style={{ color: 'var(--text-secondary)' }}>
                {rj.bio || 'No biography available.'}
              </p>

              {/* Footer Actions (Always Visible) */}
              <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                 {/* Status Badge */}
                 {rj.show ? (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                     <Mic2 size={10}/> On Air
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-500 border border-gray-500/20">
                     Available
                   </span>
                 )}

                 {/* Action Buttons */}
                 <div className="flex gap-1">
                   <button onClick={() => openEdit(rj)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Edit">
                     <Edit2 size={16}/>
                   </button>
                   <button onClick={() => handleDelete(rj._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors" title="Delete">
                     <Trash2 size={16}/>
                   </button>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredRjs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center opacity-50 border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--border-color)' }}>
          <div className="p-4 rounded-full bg-[var(--bg-secondary)] mb-4"><Search size={32}/></div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No RJs found</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or add a new RJ.</p>
        </div>
      )}

      {/* --- SIDE DRAWER FORM (Same logic as before, just styled) --- */}
      {isFormOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity animate-in fade-in" onClick={() => setIsFormOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] shadow-2xl z-[210] flex flex-col animate-in slide-in-from-right duration-300" style={{ backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>
            
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{isCropping ? 'Adjust Photo' : (editingRj ? 'Edit Profile' : 'New RJ Profile')}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
              {isCropping ? (
                <div className="flex flex-col h-full bg-black">
                  <div className="relative flex-1">
                    <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                  </div>
                  <div className="p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                      <ZoomIn size={16} className="text-[var(--text-secondary)]" />
                      <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"/>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="flex-1 py-3 font-bold rounded-xl border flex items-center justify-center gap-2 hover:bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><RotateCcw size={16}/> Cancel</button>
                      <button onClick={handleCropSave} className="flex-1 py-3 font-bold rounded-xl text-white shadow-lg hover:opacity-90 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent-color)' }}><Check size={16}/> Apply</button>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="rjForm" onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Profile Photo</label>
                    <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group hover:border-[var(--accent-color)] transition-colors cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : (
                        <div className="flex flex-col items-center p-6 text-center opacity-50"><Upload size={40} className="mb-2" /><span className="text-xs font-bold">1:1 Square Image</span></div>
                      )}
                      {previewUrl && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><Upload size={32} className="mb-2"/><span className="text-xs font-bold">Change Photo</span></div>}
                      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Name</label>
                      <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl px-4 py-3 outline-none border focus:border-[var(--accent-color)] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} placeholder="e.g. RJ Sarah" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} style={{ color: 'var(--text-primary)' }}/>
                        <input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full rounded-xl pl-11 pr-4 py-3 outline-none border focus:border-[var(--accent-color)] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} placeholder="@username" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Biography</label>
                      <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full rounded-xl px-4 py-3 outline-none border focus:border-[var(--accent-color)] transition-colors h-32 resize-none" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} placeholder="Tell listeners about this RJ..." required />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {!isCropping && (
              <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 font-bold rounded-xl border hover:opacity-70 transition-opacity" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
                  <button form="rjForm" type="submit" disabled={submitting} className="flex-1 py-3 font-bold text-white rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent-color)' }}>{submitting && <Loader2 size={18} className="animate-spin"/>} {editingRj ? 'Save Changes' : 'Create Profile'}</button>
              </div>
            )}
          </div>
        </ModalPortal>
      )}
    </div>
  );
}