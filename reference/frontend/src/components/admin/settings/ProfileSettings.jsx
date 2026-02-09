import React, { useState, useRef } from 'react';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useFetch from '../../../hooks/useFetch'; // ✅ Using Hook
import ImageCropperModal from './ImageCropperModal';

export default function ProfileSettings({ user, setUser }) {
  const [formData, setFormData] = useState({ name: user?.name || '' });
  
  // Use custom hook for API calls
  const { put, loading } = useFetch(); 

  // Avatar Logic
  const [imageSrc, setImageSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Handle File Selection
  const handleFileSelect = (file) => {
    if (!file) return;
    // Basic validation before reading
    if (!file.type.startsWith('image/')) return toast.error("Only image files are allowed");
    if (file.size > 5 * 1024 * 1024) return toast.error("File size must be under 5MB");

    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result));
    reader.readAsDataURL(file);
  };

  // 2. Upload Handler (Uses useFetch)
  const handleUploadCroppedImage = async (croppedBlob) => {
    const data = new FormData();
    data.append('avatar', croppedBlob, 'avatar.jpg');

    // ✅ Hook handles loading state, error catching, and toasts automatically
    const { success, data: responseData } = await put('/users/avatar', data, {
        successMessage: "Profile photo updated!"
    });

    if (success) {
      setUser(prev => ({ ...prev, avatar: responseData.data.avatar }));
      setImageSrc(null); // Close modal on success
    }
  };

  // 3. Text Profile Update (Uses useFetch)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name cannot be empty");
    if (formData.name === user.name) return toast.info("No changes detected");

    const { success, data: responseData } = await put('/users/profile', { name: formData.name }, {
        successMessage: "Profile details updated!"
    });

    if (success) {
      setUser(prev => ({ ...prev, name: responseData.data.name }));
    }
  };

  // Drag & Drop Handlers
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">Profile Details</h3>
          <p className="text-sm text-[var(--text-secondary)]">Update your photo and personal details.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Avatar Area */}
          <div 
              className={`relative group w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 transition-all cursor-pointer flex-shrink-0 shadow-lg
              ${isDragging 
                  ? 'border-[var(--accent-color)] scale-105 shadow-[var(--accent-color)]/20' 
                  : 'border-[var(--bg-secondary)] hover:border-[var(--accent-color)]'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
          >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-10 backdrop-blur-[1px]">
                  <Camera size={28} />
                  <span className="text-xs font-bold mt-1 uppercase tracking-wide">Change</span>
              </div>
              
              {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      <User size={48} />
                  </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => { 
                    if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                        e.target.value = null; 
                    }
                }} 
              />
          </div>

          {/* Form Area */}
          <div className="flex-1 space-y-6 w-full">
              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
                  <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 ml-1">Full Name</label>
                      <input 
                          type="text" 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-color)] outline-none transition-all font-medium"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 ml-1">Email Address</label>
                      <input 
                          type="email" 
                          value={user.email} 
                          disabled 
                          className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] opacity-60 cursor-not-allowed font-medium text-[var(--text-secondary)]"
                      />
                  </div>

                  <div className="pt-2">
                      <button 
                          type="submit" 
                          disabled={loading || formData.name === user.name}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-color)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} 
                          Save Changes
                      </button>
                  </div>
              </form>
          </div>
        </div>
      </div>

      {imageSrc && (
        <ImageCropperModal 
          imageSrc={imageSrc}
          isUploading={loading} // Pass loading state to disable buttons
          onCancel={() => { setImageSrc(null); }}
          onCropComplete={handleUploadCroppedImage}
        />
      )}
    </>
  );
}