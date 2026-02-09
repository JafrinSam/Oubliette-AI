import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search, FileCode, Database, Cpu, ArrowRight, ArrowLeft,
    CheckCircle, Plus, Terminal, HardDrive, Box, Loader2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatBytes } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export default function CreateJob() {
    const navigate = useNavigate();
    const toast = useToast();

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Selection State
    const [selectedScript, setSelectedScript] = useState(null);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [selectedRuntime, setSelectedRuntime] = useState(null);

    // Data State
    const [scripts, setScripts] = useState([]);
    const [datasets, setDatasets] = useState([]);
    const [runtimes, setRuntimes] = useState([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch based on current step to save bandwidth
                if (step === 1 && scripts.length === 0) {
                    const res = await api.get('/scripts');
                    // Flatten the grouped script library for the list view
                    // Input: { "General": [{ name: "X", versions: [...] }] }
                    const flatScripts = [];
                    Object.values(res.data).forEach(group => {
                        group.forEach(scriptGroup => {
                            scriptGroup.versions.forEach(ver => {
                                flatScripts.push({
                                    ...ver,
                                    displayName: scriptGroup.name // Ensure logical name is attached
                                });
                            });
                        });
                    });
                    setScripts(flatScripts);
                }
                else if (step === 2 && datasets.length === 0) {
                    const res = await api.get('/datasets');
                    setDatasets(res.data);
                }
                else if (step === 3 && runtimes.length === 0) {
                    const res = await api.get('/runtimes');
                    setRuntimes(res.data);
                }
            } catch (err) {
                console.error(err);
                toast.error("Error", "Failed to load resources");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [step]);

    // --- 2. FILTERING LOGIC ---
    const filteredItems = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        let source = [];

        if (step === 1) source = scripts;
        if (step === 2) source = datasets;
        if (step === 3) source = runtimes;

        return source.filter(item => {
            // Check ID
            if (item.id.toLowerCase().includes(lowerSearch)) return true;
            // Check Name/Filename
            const name = item.name || item.displayName || item.filename || '';
            if (name.toLowerCase().includes(lowerSearch)) return true;
            // Check Tag (for runtimes)
            if (item.tag && item.tag.toLowerCase().includes(lowerSearch)) return true;
            return false;
        });
    }, [step, searchTerm, scripts, datasets, runtimes]);

    // --- 3. SUBMISSION ---
    const handleSubmit = async () => {
        if (!selectedScript || !selectedDataset || !selectedRuntime) return;

        setSubmitting(true);
        try {
            const payload = {
                scriptId: selectedScript.id,
                datasetId: selectedDataset.id,
                runtimeId: selectedRuntime.id
            };

            const { data } = await api.post('/jobs', payload);
            toast.success("Mission Launched", `Job ${data.job.id} is now queued.`);
            navigate('/jobs');
        } catch (error) {
            toast.error("Launch Failed", error.response?.data?.error || "Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    // --- 4. NAVIGATION HANDLERS ---
    const handleNext = () => {
        setSearchTerm(''); // Clear search on step change
        setStep(p => p + 1);
    };

    const handleBack = () => {
        setSearchTerm('');
        setStep(p => p - 1);
    };

    // --- RENDER HELPERS ---
    const renderStepContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Loading Resources...</p>
            </div>
        );

        if (filteredItems.length === 0) return (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <p className="text-text-muted font-bold">No resources found.</p>
                <p className="text-xs text-text-muted mt-1">Try adjusting your search terms.</p>
            </div>
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <SelectionCard
                        key={item.id}
                        item={item}
                        step={step}
                        selected={
                            step === 1 ? selectedScript?.id === item.id :
                                step === 2 ? selectedDataset?.id === item.id :
                                    selectedRuntime?.id === item.id
                        }
                        onSelect={(itm) => {
                            if (step === 1) setSelectedScript(itm);
                            if (step === 2) setSelectedDataset(itm);
                            if (step === 3) setSelectedRuntime(itm);
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-main">Launch New Mission</h1>
                <p className="text-text-muted">Configure your training parameters in 3 steps.</p>
            </div>

            {/* Stepper */}
            <StepIndicator step={step} />

            {/* Controls Bar */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-10 shadow-xl shadow-black/20">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-main outline-none focus:border-primary transition-colors"
                        placeholder={
                            step === 1 ? "Search Scripts (Name, ID)..." :
                                step === 2 ? "Search Datasets (Name, Hash)..." :
                                    "Search Runtimes (Tag, Name)..."
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Add New Button (Only Step 1 & 2) */}
                {step === 1 && (
                    <Link to="/script-lab" className="flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-main hover:text-primary transition-colors">
                        <Plus size={16} /> Create Script
                    </Link>
                )}
                {step === 2 && (
                    <Link to="/datasets" className="flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-main hover:text-primary transition-colors">
                        <Plus size={16} /> Upload Dataset
                    </Link>
                )}
                {step === 3 && (
                    <div className="text-xs font-mono text-text-muted px-4">
                        (Runtimes managed by Admin)
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="min-h-[400px]">
                {renderStepContent()}
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-border">
                <button
                    onClick={handleBack}
                    disabled={step === 1 || submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-text-muted hover:bg-surface-hover disabled:opacity-0 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="flex gap-4 items-center">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Selection</p>
                        <p className="text-sm font-bold text-text-main">
                            {step === 1 ? (selectedScript ? selectedScript.displayName : "None") :
                                step === 2 ? (selectedDataset ? selectedDataset.name : "None") :
                                    (selectedRuntime ? selectedRuntime.name : "None")}
                        </p>
                    </div>

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedScript) ||
                                (step === 2 && !selectedDataset)
                            }
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next Step <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedRuntime || submitting}
                            className="flex items-center gap-2 px-8 py-3 bg-success text-white rounded-xl font-bold shadow-lg shadow-success/20 hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Terminal size={18} />}
                            Launch Mission
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StepIndicator({ step }) {
    const steps = [
        { id: 1, label: "Script", icon: FileCode },
        { id: 2, label: "Dataset", icon: Database },
        { id: 3, label: "Runtime", icon: Box },
    ];

    return (
        <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-hover -z-10 rounded-full"></div>
            <div
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>

            {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-4">
                    <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300
                        ${step >= s.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-surface border-border text-text-muted'}
                    `}>
                        <s.icon size={20} />
                    </div>
                    <span className={`text-xs font-bold ${step >= s.id ? 'text-text-main' : 'text-text-muted'}`}>
                        {s.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function SelectionCard({ item, step, selected, onSelect }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onSelect(item)}
            className={`
                cursor-pointer rounded-2xl border p-5 transition-all duration-200 relative overflow-hidden group
                ${selected
                    ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]'
                    : 'bg-surface border-border hover:border-primary/50 hover:shadow-lg'}
            `}
        >
            {selected && (
                <div className="absolute top-3 right-3 text-primary">
                    <CheckCircle size={20} className="fill-primary/20" />
                </div>
            )}

            {/* --- SCRIPT CARD --- */}
            {step === 1 && (
                <>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-surface-hover rounded-lg text-text-muted group-hover:text-primary transition-colors">
                            <FileCode size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main text-sm">{item.displayName}</h3>
                            <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">v{item.version}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-text-muted flex justify-between">
                            <span>Category:</span> <span className="text-text-main">{item.category}</span>
                        </p>
                        <p className="text-xs text-text-muted flex justify-between">
                            <span>Hash:</span> <span className="font-mono text-[10px]">{item.integrityHash?.substring(0, 8)}...</span>
                        </p>
                    </div>
                </>
            )}

            {/* --- DATASET CARD --- */}
            {step === 2 && (
                <>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-surface-hover rounded-lg text-text-muted group-hover:text-primary transition-colors">
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main text-sm">{item.name}</h3>
                            <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">v{item.version}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-text-muted flex justify-between">
                            <span>Size:</span> <span className="text-text-main">{formatBytes(item.sizeBytes)}</span>
                        </p>
                        <p className="text-xs text-text-muted flex justify-between">
                            <span>Uploaded:</span> <span className="text-text-main">{new Date(item.uploadedAt).toLocaleDateString()}</span>
                        </p>
                    </div>
                </>
            )}

            {/* --- RUNTIME CARD --- */}
            {step === 3 && (
                <>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-surface-hover rounded-lg text-text-muted group-hover:text-primary transition-colors">
                            <Box size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main text-sm">{item.name}</h3>
                            {item.isDefault && <span className="text-[10px] font-bold text-primary uppercase">Default</span>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                            <p className="text-[10px] text-text-muted font-mono break-all">{item.tag}</p>
                        </div>
                        <p className="text-xs text-text-muted flex justify-between">
                            <span>Size:</span> <span className="text-text-main">{formatBytes(item.sizeBytes)}</span>
                        </p>
                    </div>
                </>
            )}
        </motion.div>
    );
}
