import { useState, useEffect } from 'react';
import {
    RefreshCw, UploadCloud, CheckCircle, AlertTriangle,
    Box, Trash2, HardDrive, Cpu, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { formatBytes } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export default function RuntimeManager() {
    const [runtimes, setRuntimes] = useState([]);
    const [untracked, setUntracked] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const toast = useToast();

    useEffect(() => { fetchRuntimes(); }, []);

    const fetchRuntimes = async () => {
        try {
            const { data } = await api.get('/runtimes');
            setRuntimes(data);
        } catch (e) { console.error(e); }
    };

    // --- SYNC LOGIC ---
    const handleScan = async () => {
        setIsScanning(true);
        try {
            const { data } = await api.get('/runtimes/scan');
            if (data.found > 0) {
                setUntracked(data.images);
                toast.info("Scan Complete", `Found ${data.found} new Docker images.`);
            } else {
                setUntracked([]);
                toast.success("System Sync", "Database is up to date with Docker Daemon.");
            }
        } catch (error) {
            toast.error("Scan Failed", "Could not talk to Docker Socket.");
        } finally {
            setIsScanning(false);
        }
    };

    const confirmRegistration = async (image, customName) => {
        try {
            await api.post('/runtimes/register', {
                images: [{
                    dockerId: image.dockerId,
                    tag: image.tags[0],
                    sizeBytes: image.sizeBytes,
                    name: customName || image.tags[0].split(':')[0]
                }]
            });

            toast.success("Registered", `${image.tags[0]} added to database.`);
            setUntracked(prev => prev.filter(i => i.dockerId !== image.dockerId));
            fetchRuntimes();
        } catch (error) {
            toast.error("Error", "Registration failed");
        }
    };

    // --- DELETE LOGIC ---
    const handleDelete = async (id) => {
        if (!confirm("Delete this runtime environment?")) return;
        try {
            await api.delete(`/runtimes/${id}`);
            setRuntimes(prev => prev.filter(r => r.id !== id));
            toast.success("Deleted", "Runtime removed from database.");
        } catch (e) { toast.error("Error", "Delete failed"); }
    };

    return (
        <div className="space-y-8 pb-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
                        <Cpu className="text-primary" /> Runtime Environments
                    </h1>
                    <p className="text-text-muted mt-1">Manage Docker images available for offline training.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors font-bold text-text-muted hover:text-primary"
                    >
                        <RefreshCw size={18} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? "Scanning..." : "Sync with Docker"}
                    </button>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all"
                    >
                        <UploadCloud size={18} /> Load Tarball
                    </button>
                </div>
            </div>

            {/* --- 1. UNTRACKED IMAGES (Discovery Area) --- */}
            <AnimatePresence>
                {untracked.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface border-l-4 border-l-warning rounded-r-xl border-y border-r border-border p-6 shadow-lg mb-8"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <AlertTriangle className="text-warning shrink-0" size={24} />
                            <div>
                                <h3 className="text-lg font-bold text-text-main">New Images Detected</h3>
                                <p className="text-sm text-text-muted">These images exist in Docker but are not in the Oubliette Database.</p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {untracked.map((img) => (
                                <div key={img.dockerId} className="flex items-center justify-between bg-background p-4 rounded-lg border border-border">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm font-bold text-text-main">{img.tags[0]}</span>
                                        <span className="text-xs text-text-muted font-mono">{img.dockerId.substring(7, 19)} • {formatBytes(img.sizeBytes)}</span>
                                    </div>
                                    <button
                                        onClick={() => confirmRegistration(img)}
                                        className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success border border-success/20 rounded-lg hover:bg-success hover:text-white transition-all font-bold text-xs"
                                    >
                                        <Plus size={14} /> Add to Library
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 2. REGISTERED RUNTIMES GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {runtimes.map((rt) => (
                    <div key={rt.id} className="bg-surface rounded-2xl border border-border p-6 hover:shadow-card transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-surface-hover rounded-xl text-primary">
                                <Box size={24} />
                            </div>
                            {rt.isDefault && (
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Default
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-text-main text-lg mb-1">{rt.name}</h3>
                        <p className="text-xs text-text-muted font-mono mb-4 break-all">{rt.tag}</p>

                        <div className="flex items-center gap-4 text-xs text-text-muted border-t border-border pt-4">
                            <div className="flex items-center gap-1">
                                <HardDrive size={12} />
                                {formatBytes(rt.sizeBytes)}
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle size={12} className="text-success" />
                                Ready
                            </div>
                            <button
                                onClick={() => handleDelete(rt.id)}
                                className="ml-auto p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-error transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- UPLOAD MODAL --- */}
            <UploadImageModal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onSuccess={() => {
                    handleScan(); // Auto-scan after upload to find the newly loaded image
                    setShowUpload(false);
                }}
            />
        </div>
    );
}

// Sub-component for Upload Modal
function UploadImageModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const toast = useToast();

    if (!isOpen) return null;

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('image', file);

        try {
            await api.post('/runtimes/upload', fd, {
                // Remove custom headers to let browser handle boundary correctly
                timeout: 600000 // 10 minutes timeout for large files
            });
            toast.success("Loaded", "Image loaded into Docker. Scanning now...");
            onSuccess();
        } catch (e) {
            toast.error("Failed", "Upload failed. Check file size or server limits.");
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-text-main mb-4">Ingest Runtime Image</h3>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 hover:bg-surface-hover transition-colors relative">
                    <input
                        type="file"
                        accept=".tar"
                        onChange={e => setFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <HardDrive className="mx-auto text-text-muted mb-2" size={32} />
                    <p className="text-sm font-bold text-text-main">{file ? file.name : "Select .tar file"}</p>
                    <p className="text-xs text-text-muted">Docker Save Archives (Max 20GB)</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-text-muted hover:text-text-main font-bold">Cancel</button>
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {uploading && <RefreshCw className="animate-spin" size={16} />}
                        {uploading ? "Ingesting..." : "Start Ingest"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
