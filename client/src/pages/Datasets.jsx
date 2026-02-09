import { useState, useEffect, useMemo } from 'react';
import { 
    FileText, Download, Trash2, Database, Plus, HardDrive, 
    GitCompare, GitBranch, ChevronDown, Check, X, 
    ArrowRight, Loader2, RefreshCw, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { formatBytes } from '../lib/utils';
import { useToast } from '../context/ToastContext'; // Assuming you have this from previous steps

export default function Datasets() {
    const [rawDatasets, setRawDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diffSelection, setDiffSelection] = useState([]); // Stores [id1, id2]
    const [showUpload, setShowUpload] = useState(false);
    const [showDiffModal, setShowDiffModal] = useState(false);
    const [diffResult, setDiffResult] = useState(null);
    const toast = useToast();

    useEffect(() => { fetchDatasets(); }, []);

    const fetchDatasets = async () => {
        try {
            const { data } = await api.get('/datasets');
            setRawDatasets(data);
        } catch (error) { console.error("Fetch failed", error); } 
        finally { setLoading(false); }
    };

    // --- 1. GROUPING LOGIC (Client-Side DVC) ---
    const groupedDatasets = useMemo(() => {
        const groups = {};
        rawDatasets.forEach(d => {
            const name = d.name || "Untitled";
            if (!groups[name]) groups[name] = [];
            groups[name].push(d);
        });
        // Sort versions desc inside groups
        Object.keys(groups).forEach(k => {
            groups[k].sort((a, b) => b.version - a.version);
        });
        return groups;
    }, [rawDatasets]);

    // --- 2. DIFF HANDLERS ---
    const toggleDiffSelect = (id) => {
        if (diffSelection.includes(id)) {
            setDiffSelection(prev => prev.filter(i => i !== id));
        } else {
            if (diffSelection.length >= 2) {
                toast.warning("Limit Reached", "You can only compare 2 datasets at a time.");
                return;
            }
            setDiffSelection(prev => [...prev, id]);
        }
    };

    const runDiff = async () => {
        if (diffSelection.length !== 2) return;
        setDiffResult(null);
        setShowDiffModal(true);
        try {
            const { data } = await api.get(`/datasets/diff?idA=${diffSelection[0]}&idB=${diffSelection[1]}`);
            setDiffResult(data);
        } catch (error) {
            toast.error("Diff Failed", "Could not compute comparison.");
            setShowDiffModal(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this version?')) return;
        try {
            await api.delete(`/datasets/${id}`);
            setRawDatasets(prev => prev.filter(d => d.id !== id));
            toast.success("Deleted", "Dataset version removed.");
        } catch (error) { toast.error("Error", "Delete failed"); }
    };

    const handleDownload = (id, filename) => {
        window.open(`/api/datasets/${id}/download`, '_blank');
    };

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="space-y-8 pb-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Data Vault</h1>
                    <p className="text-text-muted mt-1">Versioned storage with diff capabilities.</p>
                </div>
                <div className="flex gap-3">
                    {diffSelection.length > 0 && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={runDiff}
                            disabled={diffSelection.length !== 2}
                            className="flex items-center gap-2 px-5 py-2.5 bg-text-main text-background rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <GitCompare size={18} />
                            Compare ({diffSelection.length}/2)
                        </motion.button>
                    )}
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                    >
                        <Plus size={18} /> Upload Data
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Versions" value={rawDatasets.length} icon={Database} color="text-blue-500" bg="bg-blue-500/10" />
                <StatCard label="Logical Datasets" value={Object.keys(groupedDatasets).length} icon={GitBranch} color="text-purple-500" bg="bg-purple-500/10" />
                <StatCard label="Total Storage" value={formatBytes(rawDatasets.reduce((acc, d) => acc + parseInt(d.sizeBytes || 0), 0))} icon={HardDrive} color="text-emerald-500" bg="bg-emerald-500/10" />
            </div>

            {/* DATASETS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.keys(groupedDatasets).length === 0 ? (
                    <div className="col-span-full py-20 text-center text-text-muted bg-surface rounded-3xl border border-border">
                        No datasets found. Upload one to get started.
                    </div>
                ) : (
                    Object.entries(groupedDatasets).map(([name, versions]) => (
                        <DatasetCard 
                            key={name} 
                            name={name} 
                            versions={versions} 
                            onDiff={toggleDiffSelect}
                            selectedIds={diffSelection}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                        />
                    ))
                )}
            </div>

            {/* MODALS */}
            <UploadModal 
                isOpen={showUpload} 
                onClose={() => setShowUpload(false)} 
                existingNames={Object.keys(groupedDatasets)}
                onSuccess={fetchDatasets}
            />

            <DiffResultModal 
                isOpen={showDiffModal} 
                onClose={() => setShowDiffModal(false)} 
                result={diffResult} 
            />
        </div>
    );
}

// --- 3. SUB-COMPONENTS ---

function DatasetCard({ name, versions, onDiff, selectedIds, onDelete, onDownload }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const latest = versions[0]; // First one is latest due to sort

    return (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden transition-all hover:shadow-card group">
            {/* Header (Latest Version) */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-surface-hover rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors relative">
                        <Database size={24} />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-surface"></span>
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => onDiff(latest.id)}
                            className={`p-2 rounded-lg transition-colors ${selectedIds.includes(latest.id) ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover hover:text-primary'}`}
                            title="Select for Diff"
                        >
                            <GitCompare size={16} />
                        </button>
                        <button onClick={() => onDownload(latest.id, latest.filename)} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-primary transition-colors">
                            <Download size={16} />
                        </button>
                    </div>
                </div>
                
                <h3 className="font-bold text-text-main text-lg mb-1 truncate">{name}</h3>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">v{latest.version}</span>
                    <span>•</span>
                    <span>{formatBytes(latest.sizeBytes)}</span>
                    <span>•</span>
                    <span>{new Date(latest.uploadedAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Versions Dropdown */}
            <div className="bg-surface-hover/50 border-t border-border">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-text-muted hover:text-text-main transition-colors"
                >
                    <span>{versions.length} Version{versions.length !== 1 && 's'} History</span>
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            {versions.map((v) => (
                                <div key={v.id} className="flex items-center justify-between px-5 py-2 hover:bg-surface-hover/80 transition-colors border-t border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            onClick={() => onDiff(v.id)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${selectedIds.includes(v.id) ? 'bg-primary border-primary text-white' : 'border-text-muted/30'}`}
                                        >
                                            {selectedIds.includes(v.id) && <Check size={10} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text-main">v{v.version}</p>
                                            <p className="text-[10px] text-text-muted font-mono">{v.uploadedAt.split('T')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onDownload(v.id, v.filename)} className="text-text-muted hover:text-primary"><Download size={14} /></button>
                                        <button onClick={() => onDelete(v.id)} className="text-text-muted hover:text-error"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- 4. UPLOAD MODAL WITH PROGRESS ---

function UploadModal({ isOpen, onClose, existingNames, onSuccess }) {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('NEW_VERSION'); // NEW_VERSION | NEW_DATASET
    const [selectedName, setSelectedName] = useState(existingNames[0] || "");
    const [newName, setNewName] = useState("");
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();

    if (!isOpen) return null;

    const handleUpload = async () => {
        if (!file) return;
        
        setIsUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('dataset', file);
        formData.append('versionAction', mode);
        formData.append('name', mode === 'NEW_VERSION' ? selectedName : newName);

        try {
            await api.post('/datasets/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }, // Axios handles boundary, but here we can hint
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percent);
                }
            });
            toast.success("Upload Complete", "Dataset stored securely.");
            onSuccess();
            onClose();
            // Reset
            setFile(null);
            setProgress(0);
        } catch (error) {
            toast.error("Upload Failed", error.response?.data?.error || "Connection error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-surface w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                    <UploadCloud className="text-primary" /> Upload Dataset
                </h2>

                {/* Mode Selection */}
                <div className="flex bg-surface-hover p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setMode('NEW_VERSION')}
                        disabled={existingNames.length === 0}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'NEW_VERSION' ? 'bg-surface shadow text-text-main' : 'text-text-muted hover:text-text-main disabled:opacity-50'}`}
                    >
                        Update Existing
                    </button>
                    <button 
                        onClick={() => setMode('NEW_DATASET')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'NEW_DATASET' ? 'bg-surface shadow text-text-main' : 'text-text-muted hover:text-text-main'}`}
                    >
                        Create New
                    </button>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-text-muted mb-2 block">
                        {mode === 'NEW_VERSION' ? "Select Dataset Family" : "New Dataset Name"}
                    </label>
                    {mode === 'NEW_VERSION' ? (
                        <select 
                            value={selectedName} 
                            onChange={(e) => setSelectedName(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
                        >
                            {existingNames.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    ) : (
                        <input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Sales_Q3_2024"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
                        />
                    )}
                </div>

                {/* File Drop Area */}
                <div className="mb-6">
                    <label className="block w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-hover transition-all">
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept=".csv" />
                        <FileText className={`mx-auto mb-2 ${file ? 'text-primary' : 'text-text-muted'}`} size={32} />
                        <p className="text-sm font-bold text-text-main">{file ? file.name : "Click to select CSV"}</p>
                        <p className="text-xs text-text-muted">{file ? formatBytes(file.size) : "Max 500MB"}</p>
                    </label>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-text-muted mb-1">
                            <span>Uploading...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary" 
                                initial={{ width: 0 }} 
                                animate={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                    <button 
                        onClick={handleUpload} 
                        disabled={isUploading || !file || (mode === 'NEW_DATASET' && !newName)}
                        className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// --- 5. DIFF RESULT MODAL ---

function DiffResultModal({ isOpen, onClose, result }) {
    if (!isOpen) return null;

    // Loading state handling for result
    const content = !result ? (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary mb-4" size={32} />
            <p className="text-text-muted">Calculating Diff...</p>
        </div>
    ) : (
        <div className="space-y-6">
            {/* Header Comparison */}
            <div className="flex items-center justify-between bg-surface-hover p-4 rounded-xl">
                <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Version A</p>
                    <p className="font-bold text-text-main">v{result.datasetA.version}</p>
                </div>
                <ArrowRight className="text-text-muted" />
                <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Version B</p>
                    <p className="font-bold text-text-main">v{result.datasetB.version}</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs text-text-muted mb-1">Row Delta</p>
                    <p className={`text-2xl font-bold ${result.diff.rows.delta.startsWith('+') ? 'text-success' : 'text-error'}`}>
                        {result.diff.rows.delta}
                    </p>
                    <p className="text-xs text-text-muted">Total: {result.diff.rows.new} rows</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs text-text-muted mb-1">Schema Status</p>
                    <p className="text-lg font-bold text-text-main">
                        {result.diff.schemaChange.isIdentical ? "Identical" : "Changed"}
                    </p>
                </div>
            </div>

            {/* Schema Details */}
            {!result.diff.schemaChange.isIdentical && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-text-muted uppercase">Schema Changes</p>
                    {result.diff.schemaChange.added.map(col => (
                        <div key={col} className="flex items-center gap-2 text-xs text-success bg-success/10 px-3 py-2 rounded-lg">
                            <Plus size={12} /> Added column: <b>{col}</b>
                        </div>
                    ))}
                    {result.diff.schemaChange.removed.map(col => (
                        <div key={col} className="flex items-center gap-2 text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
                            <X size={12} /> Removed column: <b>{col}</b>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-surface w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                        <GitCompare className="text-primary" /> Diff Report
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-lg text-text-muted"><X size={20}/></button>
                </div>
                {content}
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-text-muted font-medium">{label}</p>
                <p className="text-xl font-bold text-text-main">{value}</p>
            </div>
        </div>
    );
}