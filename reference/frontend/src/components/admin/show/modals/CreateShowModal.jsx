import React, { useState, useEffect, useCallback } from 'react';
import { X, UploadCloud, Image as ImageIcon, Eye, ArrowLeft, Sun, Moon, ZoomIn, Check, Crop as CropIcon, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { ShowAPI, RjAPI } from '../../../../services/adminapi';
import ModalPortal from '../../../utils/ModalPortal';
import { toast } from 'sonner';
import getCroppedImg from '../../../../utils/cropUtils';

// Import separated components
import PreviewHero from '../previews/PreviewHero';
import PreviewRow from '../previews/PreviewRow';

const CreateShowModal = ({ show, onClose, onSuccess }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: show?.title || '', 
    tagline: show?.tagline || '', 
    description: show?.description || '', 
    isLive: show?.isLive || false, 
    hit: show?.hit || false,
    guestName: show?.guestName || '', 
    rjs: show?.rjs ? show.rjs.map(r => r._id) : [] 
  });
  
  const [allRjs, setAllRjs] = useState([]);

  // --- IMAGE & CROP STATE ---
  const [file, setFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(show?.coverImage || null);
  
  const [imageSrc, setImageSrc] = useState(null); 
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9); 
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => { 
    RjAPI.getAll().then(({data}) => setAllRjs(data.data)).catch(console.error); 
  }, []);

  // 1. Handle New File Selection
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setIsCropping(true); 
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  // 2. NEW: Handle Cropping the EXISTING Image (Edit Mode)
  const onEditCurrentImage = async (e) => {
    // IMPORTANT: Stop the click from triggering the file input underneath
    e.stopPropagation(); 
    e.preventDefault();

    if (!previewUrl) return;

    const toastId = toast.loading("Loading image for editing...");

    try {
      // Add timestamp to URL to bypass browser caching which causes CORS errors
      const urlWithCacheBust = previewUrl + (previewUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

      // Fetch the image as a Blob (File)
      const response = await fetch(urlWithCacheBust, { mode: 'cors' });
      
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      
      // Read Blob as Data URL for the Cropper
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setIsCropping(true);
        setZoom(1);
        toast.dismiss(toastId);
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Could not load image. Please upload a new file.");
    }
  };

  // 3. Remove Image
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    setPreviewUrl(null);
    setImageSrc(null);
  };

  // 4. Generate Final Cropped Image
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cover.jpg", { type: "image/jpeg" });
      
      setFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setIsCropping(false);
      toast.success("Image updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to process image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const payload = { ...formData, IsLive: String(formData.isLive), hit: String(formData.hit), rjs: JSON.stringify(formData.rjs) }; 
      if (show) await ShowAPI.update(show._id, payload, file); 
      else {
        if (!file && !previewUrl) throw new Error("Cover image is required");
        await ShowAPI.create(payload, file); 
      }
      onSuccess(); 
      toast.success(show ? "Updated" : "Created");
    } catch (err) { 
      toast.error(err.message || "Error saving"); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleRj = (id) => setFormData(p => ({ ...p, rjs: p.rjs.includes(id) ? p.rjs.filter(x => x !== id) : [...p.rjs, id] }));
  const getSelectedRjNames = () => allRjs.filter(rj => formData.rjs.includes(rj._id)).map(rj => rj.name).join(' & ');

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={onClose} />
        
        <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          
          {/* HEADER */}
          <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
               {isPreviewMode && <button onClick={() => setIsPreviewMode(false)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-primary)' }}><ArrowLeft size={20} /></button>}
               <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{isPreviewMode ? 'Client Preview' : (show ? 'Edit Show' : 'New Show')}</h2>
            </div>
            {isPreviewMode && (
              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                {['light', 'dark'].map(t => (
                  <button key={t} onClick={() => setPreviewTheme(t)} className={`p-1.5 rounded ${previewTheme === t ? 'bg-[var(--bg-card)] shadow text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`}>
                    {t === 'light' ? <Sun size={14}/> : <Moon size={14}/>}
                  </button>
                ))}
              </div>
            )}
            {!isPreviewMode && <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {isPreviewMode ? (
               // --- PREVIEW MODE ---
               <div className={`h-full overflow-y-auto custom-scrollbar p-8 flex flex-col items-center gap-10 transition-colors duration-300 ${previewTheme === 'dark' ? 'bg-black/90' : 'bg-gray-50'}`}>
                  <div className="w-full max-w-2xl space-y-2">
                    <p className={`text-[10px] uppercase tracking-widest font-bold opacity-60 ${previewTheme === 'dark' ? 'text-white' : 'text-black'}`}>Featured Hero</p>
                    <PreviewHero data={formData} image={previewUrl} rjNames={getSelectedRjNames()} theme={previewTheme} />
                  </div>
                  <div className="w-full max-w-2xl space-y-2">
                    <p className={`text-[10px] uppercase tracking-widest font-bold opacity-60 ${previewTheme === 'dark' ? 'text-white' : 'text-black'}`}>Schedule Row</p>
                    <PreviewRow data={formData} image={previewUrl} rjNames={getSelectedRjNames()} theme={previewTheme} />
                  </div>
               </div>
            ) : (
            
            // --- EDIT MODE ---
            <div className="flex flex-col md:flex-row h-full">
              
              {/* LEFT: IMAGE UPLOADER & CROPPER */}
              <div className="w-full md:w-5/12 border-r p-6 flex flex-col relative bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border-color)' }}>
                
                {isCropping ? (
                  // 1. CROPPER VIEW
                  <div className="flex flex-col h-full animate-in fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><CropIcon size={14}/> Crop Image</h3>
                      <div className="flex gap-1">
                        <button onClick={() => setAspect(16/9)} className={`text-[10px] px-2 py-1 rounded border ${aspect === 16/9 ? 'bg-[var(--accent-color)] text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-color)]'}`}>16:9</button>
                        <button onClick={() => setAspect(1)} className={`text-[10px] px-2 py-1 rounded border ${aspect === 1 ? 'bg-[var(--accent-color)] text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-color)]'}`}>1:1</button>
                        <button onClick={() => setAspect(4/3)} className={`text-[10px] px-2 py-1 rounded border ${aspect === 4/3 ? 'bg-[var(--accent-color)] text-white border-transparent' : 'text-[var(--text-secondary)] border-[var(--border-color)]'}`}>Free</button>
                      </div>
                    </div>

                    <div className="relative flex-1 rounded-xl overflow-hidden bg-black border border-[var(--border-color)]">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <ZoomIn size={14} className="text-[var(--text-secondary)]" />
                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsCropping(false)} className="flex-1 py-2 text-xs font-bold rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]">Cancel</button>
                        <button onClick={showCroppedImage} className="flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--accent-color)] text-white flex items-center justify-center gap-2 hover:opacity-90 shadow-lg"><Check size={14}/> Apply</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 2. NORMAL PREVIEW / UPLOAD
                  <div className="flex flex-col items-center justify-center h-full relative">
                    <h3 className="font-bold mb-6 text-lg text-[var(--text-primary)]">Cover Image</h3>
                    
                    <div className="w-full aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center p-1 relative overflow-hidden group hover:border-[var(--accent-color)] transition-colors cursor-pointer bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-color)' }}>
                      
                      {/* Main File Input (Hidden but active) */}
                      <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Click to upload new image" />
                      
                      {previewUrl ? (
                        <>
                          <div className="absolute inset-0 opacity-40 blur-xl scale-110" style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover' }} />
                          <img src={previewUrl} className="relative w-full h-full object-contain z-10 rounded-2xl shadow-sm" alt="Preview" />
                          
                          {/* OVERLAY ACTIONS (z-30 to sit above input) */}
                          <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
                             {/* These buttons need pointer-events-auto to work */}
                             <div className="flex gap-3 pointer-events-auto">
                                <button 
                                  type="button"
                                  onClick={onEditCurrentImage}
                                  className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg"
                                  title="Crop current image"
                                >
                                  <CropIcon size={20} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="p-3 rounded-full bg-red-500 text-white hover:scale-110 transition-transform shadow-lg"
                                  title="Remove image"
                                >
                                  <Trash2 size={20} />
                                </button>
                             </div>
                             <p className="text-white/70 text-xs mt-3 font-medium">Click elsewhere to Upload New</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center z-10 p-6">
                          <div className="p-4 rounded-full bg-[var(--bg-secondary)] mb-4 group-hover:scale-110 transition-transform shadow-sm"><UploadCloud size={32} style={{ color: 'var(--accent-color)' }} /></div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">Click to Upload</p>
                          <p className="text-xs mt-2 opacity-60 text-[var(--text-secondary)]">JPG, PNG</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: FORM */}
              <div className="w-full md:w-7/12 p-8 flex flex-col overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--bg-card)' }}>
                <form id="showForm" onSubmit={handleSubmit} className="space-y-5">
                  {['title', 'tagline', 'guestName'].map(field => (
                    <div key={field}>
                      <label className="text-xs font-bold uppercase mb-2 block tracking-wider text-[var(--text-secondary)]">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input className="w-full rounded-xl px-4 py-3 outline-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-[var(--accent-color)] transition-colors" value={formData[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} placeholder={field === 'guestName' ? 'Optional' : ''} required={field !== 'guestName'} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-bold uppercase mb-2 block tracking-wider text-[var(--text-secondary)]">Description</label>
                    <textarea className="w-full rounded-xl px-4 py-3 outline-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-[var(--accent-color)] h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase mb-2 block tracking-wider text-[var(--text-secondary)]">Assign Hosts</label>
                    <div className="flex flex-wrap gap-2">
                      {allRjs.length > 0 ? allRjs.map(rj => (
                        <button type="button" key={rj._id} onClick={() => toggleRj(rj._id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${formData.rjs.includes(rj._id) ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]'}`}>
                          {rj.photo?.[0] && <img src={rj.photo[0]} alt="" className="w-5 h-5 rounded-full object-cover bg-black/20" />}
                          {rj.name}
                        </button>
                      )) : <p className="text-sm italic opacity-50">No RJs available.</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['isLive', 'hit'].map(key => (
                      <div key={key} className="flex justify-between items-center p-4 rounded-xl border bg-[var(--bg-secondary)] border-[var(--border-color)]">
                        <div><p className="text-sm font-bold text-[var(--text-primary)]">{key === 'isLive' ? 'Live Now' : 'Featured Hit'}</p></div>
                        <button type="button" onClick={() => setFormData({...formData, [key]: !formData[key]})} className={`w-12 h-7 rounded-full p-1 transition-all ${formData[key] ? 'bg-[var(--accent-color)]' : 'bg-[var(--border-color)]'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${formData[key] ? 'translate-x-5' : ''}`}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 border-t flex justify-between gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
             {!isPreviewMode && !isCropping ? (
               <button type="button" onClick={() => setIsPreviewMode(true)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 border hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]">
                 <Eye size={18} /> Preview
               </button>
             ) : <div className="flex-1"></div>}

             <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-6 py-3 font-bold rounded-xl border hover:opacity-70 text-[var(--text-secondary)] border-[var(--border-color)]">Cancel</button>
                {/* Save button hidden during crop to prevent errors */}
                {!isPreviewMode && !isCropping && (
                  <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 font-bold text-white rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: 'var(--accent-color)' }}>
                    {loading ? 'Saving...' : (show ? 'Save Changes' : 'Create Show')}
                  </button>
                )}
             </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default CreateShowModal;