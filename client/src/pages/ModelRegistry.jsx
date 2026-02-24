import { useState, useEffect } from 'react';
import {
    Box, Package, Clock, Download, Trash2, RotateCcw,
    MoreVertical, FileText, Search, Archive, Layers,
    ChevronDown, ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function ModelRegistry() {
    const [models, setModels] = useState([]);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'trash'
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Selection State for Drill-down
    const [expandedModelId, setExpandedModelId] = useState(null);
    const [artifactsModal, setArtifactsModal] = useState({ open: false, versionId: null, files: [] });

    const toast = useToast();

    useEffect(() => {
        fetchModels();
    }, [viewMode]);

    const fetchModels = async () => {
        setLoading(true);
        try {
            // Pass ?status=deleted if viewing trash
            const endpoint = viewMode === 'trash' ? '/models?status=deleted' : '/models';
            const { data } = await api.get(endpoint);
            setModels(data);
        } catch (error) {
            console.error(error);
            toast.error("Error", "Failed to load models");
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

    const handleSoftDelete = async (id) => {
        if (!confirm("Move this model to trash?")) return;
        try {
            await api.delete(`/models/${id}`);
            toast.success("Moved to Trash", "Model has been deactivated.");
            fetchModels();
        } catch (err) { toast.error("Failed", err.response?.data?.error); }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/models/${id}/restore`);
            toast.success("Restored", "Model is back in the active registry.");
            fetchModels();
        } catch (err) { toast.error("Failed", err.response?.data?.error); }
    };

    const handleHardDelete = async (id) => {
        if (!confirm("⚠️ PERMANENTLY DELETE?\nThis will remove all version files from disk. This cannot be undone.")) return;
        try {
            await api.delete(`/models/${id}/hard`);
            toast.success("Deleted", "Model and files permanently removed.");
            fetchModels();
        } catch (err) { toast.error("Failed", err.response?.data?.error); }
    };

    const handleDownload = async (versionId, modelName, versionNum) => {
        try {
            toast.info("Preparing Download", "Zipping artifacts...");
            const response = await api.get(`/models/versions/${versionId}/export`, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${modelName}_v${versionNum}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error("Download Failed", "Could not export artifacts.");
        }
    };

    const viewArtifacts = async (versionId) => {
        try {
            const { data } = await api.get(`/models/versions/${versionId}/artifacts`);
            setArtifactsModal({ open: true, versionId, files: data });
        } catch (err) {
            toast.error("Error", "Could not list artifacts");
        }
    };

    // Filter Logic
    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Model Registry</h1>
                    <p className="text-text-muted mt-1">Manage trained models, versions, and deployment artifacts.</p>
                </div>

                {/* View Toggle (Active / Trash) */}
                <div className="flex bg-surface border border-border p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                            ${viewMode === 'active' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}
                        `}
                    >
                        <Box size={16} /> Active Models
                    </button>
                    <button
                        onClick={() => setViewMode('trash')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                            ${viewMode === 'trash' ? 'bg-red-500 text-white shadow-lg' : 'text-text-muted hover:text-text-main'}
                        `}
                    >
                        <Trash2 size={16} /> Trash Bin
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-surface p-2 rounded-2xl border border-border shadow-sm flex items-center gap-3">
                <Search className="ml-3 text-text-muted" size={20} />
                <input
                    type="text"
                    placeholder="Search models by name or ID..."
                    className="flex-1 bg-transparent border-none outline-none text-text-main placeholder:text-text-muted h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="text-center py-20 text-text-muted">Loading Registry...</div>
            ) : filteredModels.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
                    <Package size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-text-main">No models found</h3>
                    <p className="text-text-muted text-sm">
                        {viewMode === 'active' ? "Run a training job to generate models." : "Trash bin is empty."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredModels.map((model) => (
                        <ModelCard
                            key={model.id}
                            model={model}
                            isTrash={viewMode === 'trash'}
                            expanded={expandedModelId === model.id}
                            onToggle={() => setExpandedModelId(expandedModelId === model.id ? null : model.id)}
                            onSoftDelete={() => handleSoftDelete(model.id)}
                            onRestore={() => handleRestore(model.id)}
                            onHardDelete={() => handleHardDelete(model.id)}
                            onDownload={handleDownload}
                            onViewArtifacts={viewArtifacts}
                        />
                    ))}
                </div>
            )}

            {/* Artifacts Modal */}
            <ArtifactsModal
                isOpen={artifactsModal.open}
                onClose={() => setArtifactsModal({ ...artifactsModal, open: false })}
                files={artifactsModal.files}
            />
        </div>
    );
}

// --- SUB-COMPONENT: MODEL CARD ---
function ModelCard({ model, isTrash, expanded, onToggle, onSoftDelete, onRestore, onHardDelete, onDownload, onViewArtifacts }) {
    // Get latest version for summary
    const latestVersion = model.versions?.[0];
    const versionCount = model.versions?.length || 0;

    return (
        <div className={`bg-surface border border-border rounded-2xl overflow-hidden transition-all ${expanded ? 'ring-2 ring-primary/20 shadow-xl' : 'hover:border-primary/50'}`}>

            {/* Card Header (Clickable) */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isTrash ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                        {isTrash ? <Trash2 size={24} /> : <Layers size={24} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            {model.name}
                            {isTrash && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">DELETED</span>}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                            <span className="flex items-center gap-1"><Clock size={12} /> Updated {formatDistanceToNow(new Date(model.updatedAt))} ago</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Archive size={12} /> {versionCount} Versions</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Metrics Badge (if available in latest version) */}
                    {latestVersion?.metrics && latestVersion.metrics.accuracy && (
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs font-bold flex flex-col items-end">
                            <span>ACCURACY</span>
                            <span className="text-sm">{(latestVersion.metrics.accuracy * 100).toFixed(1)}%</span>
                        </div>
                    )}

                    {/* Expand/Collapse Icon */}
                    <button className="p-2 hover:bg-surface-hover rounded-full text-text-muted">
                        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>

            {/* Expanded Content: Version History & Actions */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-background/50"
                    >
                        {/* Action Bar */}
                        <div className="p-4 flex justify-end gap-2 border-b border-border border-dashed">
                            {isTrash ? (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
                                        <RotateCcw size={16} /> Restore
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onHardDelete(); }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-colors">
                                        <AlertTriangle size={16} /> Delete Permanently
                                    </button>
                                </>
                            ) : (
                                <button onClick={(e) => { e.stopPropagation(); onSoftDelete(); }} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-red-500/10 hover:text-red-500 text-text-muted border border-border rounded-lg text-sm font-bold transition-colors">
                                    <Trash2 size={16} /> Move to Trash
                                </button>
                            )}
                        </div>

                        {/* Versions List */}
                        <div className="p-4 space-y-2">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Version History</h4>
                            {model.versions.map((ver) => (
                                <div key={ver.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            v{ver.version}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-main">
                                                Job: <span className="font-mono text-xs font-normal text-text-muted">{ver.jobId.substring(0, 8)}</span>
                                            </div>
                                            <div className="text-[10px] text-text-muted flex gap-2">
                                                <span>{(parseInt(ver.sizeBytes) / 1024 / 1024).toFixed(2)} MB</span>
                                                <span>• {new Date(ver.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Version Actions */}
                                    {!isTrash && (
                                        <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onViewArtifacts(ver.id); }}
                                                className="p-2 hover:bg-surface-hover text-text-muted hover:text-text-main rounded-lg"
                                                title="View Files"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDownload(ver.id, model.name, ver.version); }}
                                                className="p-2 bg-surface hover:bg-primary hover:text-white text-text-main border border-border hover:border-primary rounded-lg shadow-sm transition-all"
                                                title="Download ZIP"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENT: ARTIFACTS MODAL ---
function ArtifactsModal({ isOpen, onClose, files }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-text-main flex items-center gap-2">
                        <Package size={18} className="text-primary" /> Artifact Contents
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded text-text-muted"><Search size={0} /><span className="text-xl">×</span></button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {files.length === 0 ? (
                        <div className="p-8 text-center text-text-muted text-sm">Folder is empty.</div>
                    ) : (
                        files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-surface-hover rounded-lg transition-colors border-b border-border/30 last:border-0">
                                <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-text-muted" />
                                    <div>
                                        <div className="text-sm font-medium text-text-main">{f.name}</div>
                                        <div className="text-[10px] text-text-muted">
                                            {(f.size / 1024).toFixed(1)} KB • {new Date(f.created).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border bg-surface-hover/30 rounded-b-2xl">
                    <button onClick={onClose} className="w-full py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                        Close Explorer
                    </button>
                </div>
            </div>
        </div>
    );
}
