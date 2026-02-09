import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
    Save, Upload, Trash2, FileCode, Play, Terminal,
    Folder, ChevronRight, ChevronDown, Plus, GitBranch, Check, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

// ------------------------------------------------------------------
// 📝 INSTRUCTIONAL TEMPLATE
// This matches the signature expected by 'secure_wrapper.py'
// ------------------------------------------------------------------
const DEFAULT_CODE = `import os
import json
# import pandas as pd
# import torch

def train(dataset_path, save_path, hyperparameters, dataset_type):
    """
    🚀 Oubliette AI Secure Entry Point
    ----------------------------------
    The Secure Runner calls this function automatically.
    
    Args:
        dataset_path (str): Path to the input dataset (CSV, JSON, or Folder).
        save_path (str): Directory where you MUST save your model artifacts.
        hyperparameters (dict): JSON parameters passed from the UI.
        dataset_type (str): Detected type ('csv', 'image', 'text').
        
    Returns:
        dict: Metrics to display in the Dashboard (e.g., accuracy, loss).
    """
    
    print(f"⚡ Starting Training Job...")
    print(f"📂 Dataset: {dataset_path} ({dataset_type})")
    print(f"⚙️ Params: {json.dumps(hyperparameters)}")

    # 1. LOAD DATA
    # Example:
    # if dataset_type == 'csv':
    #    df = pd.read_csv(dataset_path)
    
    # 2. TRAIN MODEL
    # epochs = int(hyperparameters.get('epochs', 10))
    # lr = float(hyperparameters.get('learning_rate', 0.001))
    
    # ... training logic here ...
    
    # 3. SAVE ARTIFACTS
    # You MUST save outputs to 'save_path'. The system isolates this directory.
    model_file = os.path.join(save_path, "model.pth")
    
    # Simulating save for demo
    with open(model_file, "w") as f:
        f.write("Binary Model Data")
        
    print(f"✅ Model saved to: {model_file}")

    # 4. RETURN METRICS
    # These will be visualized in the Mission Control dashboard
    return {
        "accuracy": 0.94,
        "loss": 0.06,
        "status": "success"
    }
`;

const CATEGORIES = ["General", "Preprocessing", "Training", "Evaluation", "Post-Processing"];

export default function ScriptLab() {
    const toast = useToast();
    // Editor State
    const [code, setCode] = useState(DEFAULT_CODE);
    // ... (rest of your state variables remain the same)
    const [scriptName, setScriptName] = useState("untitled_script");
    const [category, setCategory] = useState("General");
    const [currentScriptId, setCurrentScriptId] = useState(null);

    // UI State
    const [library, setLibrary] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [showSaveModal, setShowSaveModal] = useState(false);
    const fileInputRef = useRef(null);

    // Dropdown State
    const [isCatOpen, setIsCatOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCatOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => { fetchLibrary(); }, []);

    const fetchLibrary = async () => {
        try {
            const res = await api.get('/scripts');
            setLibrary(res.data);
            setExpandedCategories(Object.keys(res.data).reduce((acc, cat) => ({ ...acc, [cat]: true }), {}));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadScript = async (scriptId, name, cat, ver) => {
        try {
            const res = await api.get(`/scripts/${scriptId}/content`);
            setCode(res.data.content);
            setScriptName(name);
            setCategory(cat);
            setCurrentScriptId(scriptId);
        } catch (err) { toast.error("Load Failed", "Failed to load script content"); }
    };

    const handleNew = () => {
        setCode(DEFAULT_CODE);
        setScriptName("new_script");
        setCategory("General");
        setCurrentScriptId(null);
    };

    // Handle Local File Upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setCode(e.target.result);
            setScriptName(file.name.replace('.py', ''));
            toast.info("File Loaded", `Imported content from ${file.name}`);
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-6rem)] gap-4 p-4 md:p-6">

            {/* --- LEFT SIDEBAR: FILE EXPLORER --- */}
            <div className="w-full lg:w-64 h-64 lg:h-full shrink-0 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm order-2 lg:order-1">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Script Library</span>
                    <button onClick={handleNew} className="p-1 hover:bg-surface-hover rounded text-primary transition-colors" title="New Script">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={20} /></div>
                    ) : Object.keys(library).length === 0 ? (
                        <div className="text-center p-4 text-xs text-text-muted">No scripts found.</div>
                    ) : (
                        Object.entries(library).map(([catName, scripts]) => (
                            <div key={catName}>
                                <button
                                    onClick={() => setExpandedCategories(p => ({ ...p, [catName]: !p[catName] }))}
                                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm font-semibold text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                                >
                                    {expandedCategories[catName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <Folder size={14} className="text-primary/70" />
                                    {catName}
                                </button>

                                <AnimatePresence>
                                    {expandedCategories[catName] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="ml-4 pl-2 border-l border-border space-y-1 overflow-hidden"
                                        >
                                            {scripts.map((script) => (
                                                <div key={script.name} className="group">
                                                    <button
                                                        onClick={() => loadScript(script.latestId, script.name, catName)}
                                                        className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between group-hover:bg-surface-hover transition-colors
                                                            ${script.name === scriptName && currentScriptId ? 'bg-primary/10 text-primary' : 'text-text-muted'}
                                                        `}
                                                    >
                                                        <span className="truncate">{script.name}</span>
                                                        <span className="bg-surface border border-border px-1.5 rounded text-[10px]">v{script.versions[0].version}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT: EDITOR --- */}
            <div className="flex-1 flex flex-col gap-4 order-1 lg:order-2 h-[600px] lg:h-auto">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-3 md:p-4 rounded-xl border border-border">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Filename Input */}
                        <div className="flex items-center gap-2">
                            <FileCode size={18} className="text-primary" />
                            <input
                                value={scriptName} onChange={(e) => setScriptName(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-text-main w-48 placeholder:text-text-muted"
                                placeholder="script_name"
                            />
                        </div>

                        <div className="h-4 w-px bg-border"></div>

                        {/* CUSTOM CATEGORY DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCatOpen(!isCatOpen)}
                                className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-main transition-colors px-2 py-1 rounded hover:bg-surface-hover"
                            >
                                {category}
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isCatOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute left-0 top-full mt-2 w-40 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 p-1"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => { setCategory(cat); setIsCatOpen(false); }}
                                                className={`
                                                    w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors
                                                    ${category === cat ? 'bg-primary/10 text-primary font-bold' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'}
                                                `}
                                            >
                                                {cat}
                                                {category === cat && <Check size={12} />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                        <input
                            type="file"
                            accept=".py"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                            title="Import File"
                        >
                            <Upload size={18} />
                        </button>

                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-primary/20"
                        >
                            <Save size={16} /> <span className="hidden sm:inline">Save Script</span><span className="sm:hidden">Save</span>
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm relative min-h-[400px]">
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val)}
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', monospace",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 }
                        }}
                        beforeMount={(monaco) => {
                            monaco.editor.defineTheme('oubliette-dark', {
                                base: 'vs-dark',
                                inherit: true,
                                rules: [],
                                colors: {
                                    'editor.background': '#1A1A1A', // Dark Theme Surface
                                    'editor.lineHighlightBackground': '#252525',
                                    'editorCursor.foreground': '#FF6B35' // Primary Orange
                                }
                            });
                        }}
                        onMount={(editor, monaco) => monaco.editor.setTheme('oubliette-dark')}
                    />
                </div>
            </div>

            {/* --- SAVE MODAL --- */}
            <SaveModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                isUpdate={!!currentScriptId}
                onConfirm={async (action) => {
                    try {
                        const blob = new Blob([code], { type: 'text/x-python' });
                        const safeFileName = scriptName.endsWith('.py') ? scriptName : `${scriptName}.py`;
                        const file = new File([blob], safeFileName, { type: 'text/x-python' });

                        const formData = new FormData();
                        formData.append('script', file);
                        formData.append('name', scriptName);
                        formData.append('category', category);
                        formData.append('versionAction', action);

                        if (currentScriptId) {
                            formData.append('previousScriptId', currentScriptId);
                        }

                        // Let Axios handle headers
                        await api.post('/scripts', formData);

                        await fetchLibrary();
                        toast.success("Script Saved", "Script saved successfully.");
                        setShowSaveModal(false);
                    } catch (error) {
                        console.error("Save failed:", error);
                        toast.error("Save Failed", error.response?.data?.error || "Failed to save script");
                    }
                }}
            />
        </div >
    );
}

// Modal Component
function SaveModal({ isOpen, onClose, isUpdate, onConfirm }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-surface p-6 rounded-2xl border border-border w-96 shadow-2xl transform transition-all">
                <h3 className="text-lg font-bold text-text-main mb-4">Save Strategy</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => onConfirm('NEW_SCRIPT')}
                        className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group"
                    >
                        <div className="font-bold text-text-main group-hover:text-primary flex items-center gap-2">
                            <Plus size={16} /> Save as New Script
                        </div>
                        <p className="text-xs text-text-muted mt-1">Create a completely separate entry.</p>
                    </button>

                    {isUpdate && (
                        <button
                            onClick={() => onConfirm('NEW_VERSION')}
                            className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group"
                        >
                            <div className="font-bold text-text-main group-hover:text-primary flex items-center gap-2">
                                <GitBranch size={16} /> Save as New Version
                            </div>
                            <p className="text-xs text-text-muted mt-1">Update history, mark as latest.</p>
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2 text-text-muted hover:text-text-main font-medium text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}