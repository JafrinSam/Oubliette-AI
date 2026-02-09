import React, { useState, useEffect, useCallback } from 'react';
import { assetApi } from '../services/assetApi';
import { useTheme } from '../context/ThemeContext'; // Import your hook
import toast, { Toaster } from 'react-hot-toast';
import { 
  Music, Edit3, Trash2, UploadCloud, RefreshCw, 
  X, User, Disc, Tag, Image as ImageIcon
} from 'lucide-react';

// --- Type Badge Helper (Kept semantic colors, adapted for themes) ---
const TypeBadge = ({ type }) => {
  const styles = {
    Music: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    Jingle: "text-purple-500 border-purple-500/30 bg-purple-500/10",
    Ad: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
    StationID: "text-green-500 border-green-500/30 bg-green-500/10",
    "Prerecorded Show": "text-orange-500 border-orange-500/30 bg-orange-500/10",
    default: "text-[var(--text-secondary)] border-[var(--border-color)] bg-[var(--bg-secondary)]"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type] || styles.default}`}>
      {type}
    </span>
  );
};

export default function AdminMusicManager() {
  const { currentTheme } = useTheme(); // Optional: used if we need JS access to theme
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload State
  const [uploadFiles, setUploadFiles] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({ artist: '', title: '', type: 'Music' });

  // Edit State
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '', album: '', type: 'Music' });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetApi.getAll();
      setAssets(data);
    } catch (err) {
      toast.error("Failed to sync library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, []);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/'));
      if (validFiles.length > 0) {
        setUploadFiles(validFiles);
        toast.success(`${validFiles.length} audio file(s) ready`);
      } else {
        toast.error("Please drop valid audio files");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles) return;

    const formData = new FormData();
    Array.from(uploadFiles).forEach((file) => formData.append('musicFiles', file));
    formData.append('type', uploadMeta.type);
    if (uploadMeta.artist) formData.append('artist', uploadMeta.artist);
    if (uploadMeta.title) formData.append('title', uploadMeta.title);

    const promise = fetch('http://localhost:5000/api/file/upload', {
        method: 'POST',
        body: formData
    }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    });

    toast.promise(promise, {
      loading: 'Uploading & Extracting Metadata...',
      success: () => {
        setUploadFiles(null);
        setUploadMeta({ artist: '', title: '', type: 'Music' });
        setShowUploadModal(false);
        fetchAssets();
        return 'Upload Complete';
      },
      error: (err) => `Upload failed: ${err.message}`
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    toast.promise(assetApi.update(editingAsset._id, editForm), {
      loading: 'Updating...',
      success: () => {
        setEditingAsset(null);
        fetchAssets();
        return 'Asset Updated';
      },
      error: (err) => `Error: ${err.message}`
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this track?")) return;
    toast.promise(assetApi.delete(id), {
      loading: 'Deleting...',
      success: () => { fetchAssets(); return 'Asset Deleted'; },
      error: 'Delete failed'
    });
  };

  // --- STYLES (Using CSS Variables) ---
  const containerStyle = "p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-[var(--bg-primary)] transition-colors duration-300";
  const cardStyle = "bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg transition-colors duration-300";
  const headerTextStyle = "text-[var(--text-primary)]";
  const subTextStyle = "text-[var(--text-secondary)]";
  const inputStyle = "w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors";
  const buttonPrimaryStyle = "px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium shadow-md transition-all";
  const buttonSecondaryStyle = "px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors";

  return (
    <div className={containerStyle}>
      <Toaster position="bottom-right" toastOptions={{ 
        style: { 
          background: 'var(--bg-card)', 
          color: 'var(--text-primary)', 
          border: '1px solid var(--border-color)' 
        } 
      }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${headerTextStyle}`}>
            <Disc className="text-[var(--accent-color)]" /> Master Music Library
          </h1>
          <p className={`text-sm ${subTextStyle}`}>Manage assets, sync ID3 tags, and organize station media.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAssets} className={`p-2 rounded-lg transition hover:bg-[var(--bg-secondary)] ${subTextStyle} hover:text-[var(--text-primary)]`}>
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className={`flex items-center gap-2 ${buttonPrimaryStyle}`}
          >
            <UploadCloud size={18} /> Upload New
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className={cardStyle}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
              <th className={`p-4 font-medium text-xs uppercase ${subTextStyle}`}>Track Info</th>
              <th className={`p-4 font-medium text-xs uppercase ${subTextStyle}`}>Artist</th>
              <th className={`p-4 font-medium text-xs uppercase ${subTextStyle}`}>Album</th>
              <th className={`p-4 font-medium text-xs uppercase ${subTextStyle}`}>Type</th>
              <th className={`p-4 font-medium text-xs uppercase ${subTextStyle}`}>Duration</th>
              <th className={`p-4 font-medium text-xs uppercase text-right ${subTextStyle}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {assets.map((asset) => (
              <tr key={asset._id} className="group hover:bg-[var(--bg-secondary)]/50 transition duration-150">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Cover Art */}
                    <div className="w-10 h-10 rounded overflow-hidden bg-[var(--bg-secondary)] flex-shrink-0 border border-[var(--border-color)]">
                      {asset.coverArt ? (
                        <img 
                          src={`http://localhost:5000${asset.coverArt}`} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                          onError={(e) => {e.target.style.display='none'}}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${subTextStyle}`}>
                          <Music size={16} />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className={`font-medium ${headerTextStyle}`}>{asset.title || asset.originalName}</div>
                      <div className={`text-xs font-mono ${subTextStyle}`}>{asset.filename}</div>
                    </div>
                  </div>
                </td>
                <td className={`p-4 text-sm ${subTextStyle}`}>
                  {asset.artist && asset.artist !== 'Unknown' ? (
                    <span className="flex items-center gap-1.5"><User size={12} className="opacity-50"/> {asset.artist}</span>
                  ) : <span className="italic opacity-50">No Artist Tag</span>}
                </td>
                <td className={`p-4 text-sm ${subTextStyle}`}>
                  {asset.album || <span className="italic opacity-50">--</span>}
                </td>
                <td className="p-4">
                  <TypeBadge type={asset.type} />
                </td>
                <td className={`p-4 text-sm font-mono ${subTextStyle}`}>
                  {asset.duration ? new Date(asset.duration * 1000).toISOString().substr(14, 5) : '--:--'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => {
                        setEditingAsset(asset);
                        setEditForm({ 
                          title: asset.title, 
                          artist: asset.artist, 
                          album: asset.album, 
                          type: asset.type 
                        });
                      }}
                      className={`p-1.5 rounded transition hover:bg-[var(--accent-color)]/10 hover:text-[var(--accent-color)] ${subTextStyle}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(asset._id)}
                      className={`p-1.5 rounded transition hover:bg-[var(--danger-color)]/10 hover:text-[var(--danger-color)] ${subTextStyle}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {assets.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className={`p-8 text-center ${subTextStyle}`}>
                  No assets found. Upload some music to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`${cardStyle} w-full max-w-lg p-6 shadow-2xl border-[var(--accent-color)]/30`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${headerTextStyle}`}>
                <Tag size={18} className="text-[var(--accent-color)]" /> Edit Metadata
              </h3>
              <button onClick={() => setEditingAsset(null)} className={`${subTextStyle} hover:text-[var(--text-primary)]`}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="p-3 bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded text-[var(--accent-color)] text-xs mb-4">
                <p><strong>Note:</strong> Changes here will update the Database AND write ID3 tags to the actual MP3 file.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`text-xs font-semibold uppercase mb-1 block ${subTextStyle}`}>Track Title</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className={`text-xs font-semibold uppercase mb-1 block ${subTextStyle}`}>Artist Name</label>
                  <input type="text" value={editForm.artist} onChange={e => setEditForm({...editForm, artist: e.target.value})} className={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className={`text-xs font-semibold uppercase mb-1 block ${subTextStyle}`}>Album</label>
                  <input type="text" value={editForm.album} onChange={e => setEditForm({...editForm, album: e.target.value})} className={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className={`text-xs font-semibold uppercase mb-1 block ${subTextStyle}`}>Asset Type</label>
                  <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className={inputStyle}>
                    {['Music', 'Jingle', 'Ad', 'StationID', 'Prerecorded Show'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingAsset(null)} className={buttonSecondaryStyle}>Cancel</button>
                <button type="submit" className={buttonPrimaryStyle}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`${cardStyle} w-full max-w-lg p-6 shadow-2xl border-[var(--border-color)]`}>
            <h3 className={`text-lg font-bold mb-4 ${headerTextStyle}`}>Upload New Tracks</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              
              {/* Drag Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer relative
                  ${isDragging 
                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10' 
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-color)]'
                  }
                `}
              >
                <input 
                  type="file" multiple accept=".mp3" 
                  onChange={e => setUploadFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud size={32} className={`mx-auto mb-2 ${isDragging ? 'text-[var(--accent-color)]' : subTextStyle}`} />
                <p className={`text-sm font-medium ${headerTextStyle}`}>
                  {uploadFiles ? `${uploadFiles.length} file(s) selected` : "Drag MP3s here or click to browse"}
                </p>
                <p className={`text-xs mt-1 ${subTextStyle}`}>Supports multiple files</p>
              </div>

              <div className={`p-3 rounded text-xs bg-[var(--bg-secondary)] ${subTextStyle}`}>
                 Leave Artist/Title blank to auto-detect from file metadata.
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="Override Artist" className={inputStyle} onChange={e => setUploadMeta({...uploadMeta, artist: e.target.value})} />
                 <select className={inputStyle} onChange={e => setUploadMeta({...uploadMeta, type: e.target.value})}>
                   <option value="Music">Music</option>
                   <option value="Jingle">Jingle</option>
                   <option value="Ad">Ad</option>
                   <option value="Prerecorded Show">Prerecorded Show</option>
                 </select>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className={buttonSecondaryStyle}>Cancel</button>
                <button disabled={!uploadFiles} type="submit" className={`${buttonPrimaryStyle} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  Start Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}