import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search, FileCode, Database, Cpu, ArrowRight, ArrowLeft,
    CheckCircle, Plus, Terminal, HardDrive, Box, Loader2, Layers, Sliders
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
    const [params, setParams] = useState('{\n  "epochs": 10,\n  "batch_size": 32,\n  "learning_rate": 0.001\n}');

    // Step 5: Model State
    const [modelAction, setModelAction] = useState('NEW_VERSION'); // NEW_MODEL | NEW_VERSION
    const [selectedModel, setSelectedModel] = useState(null);
    const [newModelName, setNewModelName] = useState("");

    // Data State
    const [scripts, setScripts] = useState([]);
    const [datasets, setDatasets] = useState([]);
    const [runtimes, setRuntimes] = useState([]);
    const [models, setModels] = useState([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (step === 1 && scripts.length === 0) {
                    const res = await api.get('/scripts');
                    const flatScripts = [];
                    Object.values(res.data).forEach(group => {
                        group.forEach(sg => {
                            sg.versions.forEach(ver => {
                                flatScripts.push({ ...ver, displayName: sg.name });
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
                else if (step === 5 && models.length === 0) {
                    const res = await api.get('/models');
                    setModels(res.data);
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
        else if (step === 2) source = datasets;
        else if (step === 3) source = runtimes;
        else if (step === 5 && modelAction === 'NEW_VERSION') source = models;

        return source.filter(item => {
            if (item.id.toLowerCase().includes(lowerSearch)) return true;
            const name = item.name || item.displayName || item.tag || '';
            return name.toLowerCase().includes(lowerSearch);
        });
    }, [step, searchTerm, scripts, datasets, runtimes, models, modelAction]);

    // --- 3. SUBMISSION ---
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let parsedParams = {};
            try {
                parsedParams = JSON.parse(params);
            } catch (e) {
                toast.error("Invalid JSON", "Please check your hyperparameter syntax.");
                return;
            }

            const payload = {
                scriptId: selectedScript.id,
                datasetId: selectedDataset.id,
                runtimeId: selectedRuntime.id,
                modelAction,
                modelName: modelAction === 'NEW_MODEL' ? newModelName : undefined,
                modelId: modelAction === 'NEW_VERSION' ? selectedModel.id : undefined,
                params: parsedParams
            };

            const { data } = await api.post('/jobs', payload);
            toast.success("Mission Launched", `Job ${data.job.id} is queued.`);
            navigate('/jobs');
        } catch (error) {
            toast.error("Launch Failed", error.response?.data?.error || "Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    // --- RENDER HELPERS ---
    const renderStepContent = () => {
        if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" size={32} /><p className="mt-2 text-text-muted">Loading...</p></div>;

        // Step 4: Hyperparameters
        if (step === 4) {
            return (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-surface rounded-2xl border border-border p-1">
                        <div className="px-4 py-2 border-b border-border bg-surface-hover flex justify-between items-center">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Hyperparameters (JSON)</span>
                            <button
                                onClick={() => setParams('{\n  "epochs": 10,\n  "batch_size": 32,\n  "learning_rate": 0.001\n}')}
                                className="text-[10px] text-primary hover:underline"
                            >
                                Reset Default
                            </button>
                        </div>
                        <textarea
                            value={params}
                            onChange={(e) => setParams(e.target.value)}
                            className="w-full h-64 bg-[#1e1e1e] text-blue-300 font-mono text-sm p-4 outline-none resize-none rounded-b-xl"
                            spellCheck="false"
                        />
                    </div>
                    <p className="text-xs text-text-muted mt-3 text-center">
                        These values are injected into the container as <code>os.environ['HYPERPARAMETERS']</code>.
                    </p>
                </div>
            );
        }

        // Step 5: Output Configuration
        if (step === 5) {
            return (
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setModelAction('NEW_VERSION')}
                            className={`p-6 rounded-2xl border text-center transition-all ${modelAction === 'NEW_VERSION' ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover'}`}
                        >
                            <Layers className="mx-auto mb-2 text-primary" size={32} />
                            <h3 className="font-bold text-text-main">Improve Existing Model</h3>
                            <p className="text-xs text-text-muted mt-1">Create v2, v3... of a known model.</p>
                        </button>

                        <button
                            onClick={() => setModelAction('NEW_MODEL')}
                            className={`p-6 rounded-2xl border text-center transition-all ${modelAction === 'NEW_MODEL' ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover'}`}
                        >
                            <Plus className="mx-auto mb-2 text-primary" size={32} />
                            <h3 className="font-bold text-text-main">Train New Model</h3>
                            <p className="text-xs text-text-muted mt-1">Register a completely new entry.</p>
                        </button>
                    </div>

                    {modelAction === 'NEW_MODEL' ? (
                        <div className="bg-surface p-6 rounded-2xl border border-border">
                            <label className="text-sm font-bold text-text-muted mb-2 block">Model Name</label>
                            <input
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                placeholder="e.g. Sales_Forecaster_2024"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main outline-none focus:border-primary transition-all"
                            />
                            <p className="text-xs text-text-muted mt-2">This will create v1 automatically.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredItems.length === 0 ? <p className="text-center text-text-muted">No models found.</p> :
                                filteredItems.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedModel(m)}
                                        className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center ${selectedModel?.id === m.id ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-hover'}`}
                                    >
                                        <div>
                                            <h4 className="font-bold text-text-main">{m.name}</h4>
                                            <p className="text-xs text-text-muted">Latest: v{m.versions?.[0]?.version || 0}</p>
                                        </div>
                                        {selectedModel?.id === m.id && <CheckCircle size={20} className="text-primary" />}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            );
        }

        // Steps 1-3 (Grid)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <SelectionCard
                        key={item.id} item={item} step={step}
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
            <h1 className="text-3xl font-bold text-text-main">Launch Mission</h1>
            <StepIndicator step={step} />

            {/* Search Bar (Only for List Steps) */}
            {(step <= 3 || (step === 5 && modelAction === 'NEW_VERSION')) && (
                <div className="bg-surface p-4 rounded-2xl border border-border sticky top-4 z-10 shadow-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            className="w-full bg-background border-none outline-none pl-10 text-text-main"
                            placeholder="Search resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">{renderStepContent()}</div>

            <div className="flex justify-between items-center pt-6 border-t border-border">
                <button onClick={() => setStep(p => p - 1)} disabled={step === 1} className="px-6 py-3 font-bold text-text-muted hover:text-text-main disabled:opacity-0">Back</button>
                {step < 5 ? (
                    <button
                        onClick={() => setStep(p => p + 1)}
                        disabled={(step === 1 && !selectedScript) || (step === 2 && !selectedDataset) || (step === 3 && !selectedRuntime)}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || (modelAction === 'NEW_MODEL' && !newModelName) || (modelAction === 'NEW_VERSION' && !selectedModel)}
                        className="px-8 py-3 bg-success text-white rounded-xl font-bold hover:bg-success/90 flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="animate-spin" />} Launch
                    </button>
                )}
            </div>
        </div>
    );
}

function StepIndicator({ step }) {
    const steps = [
        { id: 1, label: "Script", icon: FileCode },
        { id: 2, label: "Dataset", icon: Database },
        { id: 3, label: "Runtime", icon: Box },
        { id: 4, label: "Params", icon: Sliders },
        { id: 5, label: "Output", icon: Layers },
    ];

    return (
        <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-hover -z-10 rounded-full"></div>
            <div
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
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
