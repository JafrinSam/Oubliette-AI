import { useState, useEffect, useRef } from 'react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import {
    Save, Upload, Trash2, FileCode, Play, Terminal,
    Folder, ChevronRight, ChevronDown, Plus, GitBranch, Check, Loader2,
    Clock, Split, Eye, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const DEFAULT_CODE = `import os
import json

def train(dataset_path, save_path, hyperparameters, dataset_type):
    """
    🚀 Oubliette AI Secure Entry Point
    """
    print(f"⚡ Starting Training Job...")
    # Your logic here...
    return {"status": "success"}
`;

const CATEGORIES = ["General", "Preprocessing", "Training", "Evaluation", "Post-Processing"];

export default function ScriptLab() {
    const toast = useToast();
    
    // --- STATE ---
    
    // Editor Content
    const [code, setCode] = useState(DEFAULT_CODE); // The "Modified" / Current code
    const [originalCode, setOriginalCode] = useState(""); // The "Original" code for Diffing
    
    // Metadata
    const [scriptName, setScriptName] = useState("untitled_script");
    const [category, setCategory] = useState("General");
    const [currentScriptId, setCurrentScriptId] = useState(null); // ID of currently loaded version
    const [currentScriptFamily, setCurrentScriptFamily] = useState(null); // The parent script object (holds all versions)

    // UI Modes
    const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'diff'
    const [diffTargetId, setDiffTargetId] = useState(null); // Which version ID are we comparing against?

    // Library Data
    const [library, setLibrary] = useState({});
    const [loading, setLoading] = useState(true);
    
    // UI Toggles
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedScripts, setExpandedScripts] = useState({}); // To show versions under a script
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    
    const fileInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // --- EFFECTS ---

    useEffect(() => {
        fetchLibrary();
        // Click outside listener for category dropdown
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCatOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- ACTIONS ---

    const fetchLibrary = async () => {
        try {
            const res = await api.get('/scripts');
            setLibrary(res.data);
            // Default expand all categories
            setExpandedCategories(Object.keys(res.data).reduce((acc, cat) => ({ ...acc, [cat]: true }), {}));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadScriptVersion = async (scriptObj, versionObj) => {
        try {
            const res = await api.get(`/scripts/${versionObj.id}/content`);
            setCode(res.data.content);
            setScriptName(scriptObj.name);
            setCategory(scriptObj.versions[0].category || "General"); // Use category from latest
            setCurrentScriptId(versionObj.id);
            setCurrentScriptFamily(scriptObj);
            
            // Reset Diff Mode
            setViewMode('edit');
            setDiffTargetId(null);
        } catch (err) { 
            toast.error("Load Failed", "Failed to load script content"); 
        }
    };

    const handleNew = () => {
        setCode(DEFAULT_CODE);
        setScriptName("new_script");
        setCategory("General");
        setCurrentScriptId(null);
        setCurrentScriptFamily(null);
        setViewMode('edit');
    };

    // Toggle Diff Mode
    const toggleDiffMode = async () => {
        if (viewMode === 'diff') {
            setViewMode('edit');
            return;
        }

        // Prepare for Diff
        if (!currentScriptFamily || currentScriptFamily.versions.length < 1) {
            toast.error("Cannot Diff", "Save this script or load an existing one first.");
            return;
        }

        // Default: Compare against the previous version (if exists), or the same version
        // Find current index
        const currentIndex = currentScriptFamily.versions.findIndex(v => v.id === currentScriptId);
        // Try to get next item in array (which is older version, since sorted desc), or just use current
        const targetVersion = currentScriptFamily.versions[currentIndex + 1] || currentScriptFamily.versions[currentIndex];
        
        await changeDiffTarget(targetVersion.id);
        setViewMode('diff');
    };

    const changeDiffTarget = async (versionId) => {
        setDiffTargetId(versionId);
        try {
            const res = await api.get(`/scripts/${versionId}/content`);
            setOriginalCode(res.data.content);
        } catch (e) {
            toast.error("Error", "Could not load comparison source.");
        }
    };

    // --- RENDERERS ---

    return (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-6rem)] gap-4 p-4 md:p-6">

            {/* === SIDEBAR: VERSION CONTROL === */}
            <div className="w-full lg:w-72 h-64 lg:h-full shrink-0 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm order-2 lg:order-1">
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-hover/50">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <GitBranch size={14}/> Script Repository
                    </span>
                    <button onClick={handleNew} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors" title="New Script">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={20} /></div>
                    ) : Object.keys(library).length === 0 ? (
                        <div className="text-center p-8 text-xs text-text-muted">No scripts found.</div>
                    ) : (
                        Object.entries(library).map(([catName, scripts]) => (
                            <div key={catName}>
                                {/* Category Header */}
                                <button
                                    onClick={() => setExpandedCategories(p => ({ ...p, [catName]: !p[catName] }))}
                                    className="flex items-center gap-2 w-full text-left px-2 py-2 text-xs font-bold text-text-muted uppercase hover:text-text-main transition-colors"
                                >
                                    {expandedCategories[catName] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    {catName}
                                </button>

                                <AnimatePresence>
                                    {expandedCategories[catName] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="ml-2 pl-2 border-l border-border/50 space-y-1 overflow-hidden"
                                        >
                                            {scripts.map((script) => (
                                                <div key={script.name} className="mb-1">
                                                    {/* Script Name */}
                                                    <button
                                                        onClick={() => setExpandedScripts(p => ({ ...p, [script.name]: !p[script.name] }))}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between hover:bg-surface-hover transition-colors
                                                            ${currentScriptFamily?.name === script.name ? 'text-text-main font-semibold' : 'text-text-muted'}
                                                        `}
                                                    >
                                                        <span className="truncate flex items-center gap-2">
                                                            <FileCode size={14} className={currentScriptFamily?.name === script.name ? "text-primary" : "opacity-50"}/>
                                                            {script.name}
                                                        </span>
                                                        <span className="text-[10px] bg-black/20 px-1.5 rounded text-text-muted">
                                                            {script.versions.length}
                                                        </span>
                                                    </button>

                                                    {/* Versions List */}
                                                    <AnimatePresence>
                                                        {expandedScripts[script.name] && (
                                                            <motion.div
                                                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                {script.versions.map((ver) => (
                                                                    <button
                                                                        key={ver.id}
                                                                        onClick={() => loadScriptVersion(script, ver)}
                                                                        className={`
                                                                            w-full text-left pl-8 pr-3 py-1.5 text-xs flex items-center justify-between border-l-2 ml-3
                                                                            ${currentScriptId === ver.id 
                                                                                ? 'border-primary bg-primary/5 text-primary font-medium' 
                                                                                : 'border-transparent text-text-muted hover:text-text-main hover:bg-surface-hover'}
                                                                        `}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <Clock size={10} /> v{ver.version}
                                                                        </span>
                                                                        <span className="text-[9px] opacity-50">
                                                                            {new Date(ver.uploadedAt).toLocaleDateString()}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
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

            {/* === MAIN EDITOR AREA === */}
            <div className="flex-1 flex flex-col gap-4 order-1 lg:order-2 h-[600px] lg:h-auto">
                
                {/* TOOLBAR */}
                <div className="bg-surface p-2 md:p-3 rounded-xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    
                    {/* Left: Info & Diff Toggle */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border">
                            <FileCode size={16} className="text-primary" />
                            <input
                                value={scriptName} onChange={(e) => setScriptName(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-text-main w-32 md:w-48 placeholder:text-text-muted text-sm"
                                placeholder="script_name"
                            />
                        </div>

                        {/* Mode Toggle */}
                        <div className="bg-background p-1 rounded-lg border border-border flex">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'edit' ? 'bg-surface shadow text-text-main' : 'text-text-muted hover:text-text-main'}`}
                                title="Edit Mode"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button
                                onClick={toggleDiffMode}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'diff' ? 'bg-surface shadow text-primary' : 'text-text-muted hover:text-text-main'}`}
                                title="Comparison Mode"
                            >
                                <Split size={16} />
                            </button>
                        </div>

                        {/* Diff Dropdown (Only in Diff Mode) */}
                        {viewMode === 'diff' && currentScriptFamily && (
                            <div className="flex items-center gap-2 text-xs animate-in fade-in slide-in-from-left-2">
                                <span className="text-text-muted font-semibold">Compare with:</span>
                                <div className="relative">
                                    <select 
                                        className="appearance-none bg-surface border border-border hover:border-primary text-text-main pl-3 pr-8 py-1.5 rounded-lg outline-none cursor-pointer"
                                        value={diffTargetId || ''}
                                        onChange={(e) => changeDiffTarget(e.target.value)}
                                    >
                                        {currentScriptFamily.versions.map(v => (
                                            <option key={v.id} value={v.id}>
                                                v{v.version} {v.id === currentScriptId ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        
                        {/* Category Selector */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCatOpen(!isCatOpen)}
                                className="flex items-center gap-2 text-xs font-medium bg-surface-hover border border-transparent hover:border-border text-text-muted hover:text-text-main transition-colors px-3 py-1.5 rounded-lg"
                            >
                                {category}
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isCatOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                        className="absolute right-0 top-full mt-2 w-40 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 p-1"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <button key={cat} onClick={() => { setCategory(cat); setIsCatOpen(false); }} className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${category === cat ? 'bg-primary/10 text-primary font-bold' : 'text-text-muted hover:bg-surface-hover'}`}>
                                                {cat} {category === cat && <Check size={12} />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-4 w-px bg-border mx-1"></div>

                        {/* File Actions */}
                        <input type="file" accept=".py" ref={fileInputRef} className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if(!file) return;
                                const r = new FileReader();
                                r.onload = (e) => { setCode(e.target.result); setScriptName(file.name.replace('.py','')); };
                                r.readAsText(file);
                            }} 
                        />
                        <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text-main transition-colors" title="Import"><Upload size={18} /></button>

                        <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-primary/20">
                            <Save size={16} /> <span className="hidden sm:inline">Save</span>
                        </button>
                    </div>
                </div>

                {/* EDITOR CONTAINER */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm relative min-h-[400px] bg-[#1e1e1e]">
                    {viewMode === 'edit' ? (
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', monospace",
                                minimap: { enabled: false },
                                automaticLayout: true,
                                padding: { top: 16 }
                            }}
                            beforeMount={(monaco) => {
                                monaco.editor.defineTheme('oubliette-dark', {
                                    base: 'vs-dark',
                                    inherit: true,
                                    rules: [],
                                    colors: { 'editor.background': '#1A1A1A' }
                                });
                            }}
                            onMount={(editor, monaco) => monaco.editor.setTheme('oubliette-dark')}
                        />
                    ) : (
                        <DiffEditor
                            height="100%"
                            language="python"
                            theme="vs-dark"
                            original={originalCode} // Left side (Old)
                            modified={code}         // Right side (Current)
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', monospace",
                                renderSideBySide: true,
                                originalEditable: false,
                                automaticLayout: true,
                            }}
                        />
                    )}
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
                        if (currentScriptId) formData.append('previousScriptId', currentScriptId);

                        await api.post('/scripts', formData);
                        await fetchLibrary();
                        toast.success("Saved", "Script saved successfully.");
                        setShowSaveModal(false);
                    } catch (error) {
                        toast.error("Save Failed", error.response?.data?.error);
                    }
                }}
            />
        </div >
    );
}

// Modal (Same as before, simplified for brevity)
function SaveModal({ isOpen, onClose, isUpdate, onConfirm }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface p-6 rounded-2xl border border-border w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-text-main mb-4">Save Script</h3>
                <div className="space-y-3">
                    <button onClick={() => onConfirm('NEW_SCRIPT')} className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group">
                        <div className="font-bold text-text-main group-hover:text-primary flex items-center gap-2"><Plus size={16} /> New Script</div>
                        <p className="text-xs text-text-muted mt-1">Create a fresh entry in the library.</p>
                    </button>
                    {isUpdate && (
                        <button onClick={() => onConfirm('NEW_VERSION')} className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group">
                            <div className="font-bold text-text-main group-hover:text-primary flex items-center gap-2"><GitBranch size={16} /> New Version</div>
                            <p className="text-xs text-text-muted mt-1">Update existing script history.</p>
                        </button>
                    )}
                </div>
                <button onClick={onClose} className="mt-4 w-full py-2 text-text-muted hover:text-text-main font-medium text-sm">Cancel</button>
            </div>
        </div>
    )
}