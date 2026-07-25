import { useState, useCallback } from 'react';
import { UploadCloud, FileText, Code, Play, CheckCircle, Loader2, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const steps = [
    { id: 1, title: 'Dataset', desc: 'CSV Data Source' },
    { id: 2, title: 'Logic', desc: 'Python Script' },
    { id: 3, title: 'Launch', desc: 'Initialize Job' },
];

export default function Upload() {
    const [currentStep, setCurrentStep] = useState(1);
    const [datasetFile, setDatasetFile] = useState(null);
    const [scriptFile, setScriptFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        if (type === 'dataset') setDatasetFile(file);
        if (type === 'script') setScriptFile(file);
    };

    const handleLaunch = async () => {
        setIsSubmitting(true);
        try {
            // 1. Upload Dataset
            const dsData = new FormData();
            dsData.append('dataset', datasetFile);
            const dsRes = await api.post('/datasets/upload', dsData, { headers: { 'Content-Type': 'multipart/form-data' }});
            
            // 2. Read Script Content (Assuming we send content, or you can upload file similarly)
            const scriptContent = await scriptFile.text();

            // 3. Create Job
            await api.post('/jobs', {
                datasetHash: dsRes.data.dataset.hash, // Use Hash from response
                userScript: scriptContent
            });
            
            navigate('/jobs');
        } catch (error) {
            console.error(error);
            alert("Launch failed. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-surface border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                
                {/* Left: Sidebar Stepper */}
                <div className="w-full md:w-1/3 bg-surface-hover border-r border-border p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">Setup Mission</h2>
                        <p className="text-text-muted text-sm mb-8">Configure your training environment.</p>
                        
                        <div className="space-y-6">
                            {steps.map((step) => (
                                <div key={step.id} className="flex items-center gap-4 relative">
                                    {/* Vertical Line */}
                                    {step.id !== 3 && <div className={clsx("absolute left-[15px] top-8 w-0.5 h-10 bg-border", currentStep > step.id && "bg-primary")} />}
                                    
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all z-10",
                                        currentStep === step.id ? "border-primary text-primary bg-surface" :
                                        currentStep > step.id ? "border-primary bg-primary text-white" :
                                        "border-border text-text-muted bg-surface"
                                    )}>
                                        {currentStep > step.id ? <CheckCircle size={16} /> : step.id}
                                    </div>
                                    <div>
                                        <p className={clsx("text-sm font-bold", currentStep === step.id ? "text-text-main" : "text-text-muted")}>{step.title}</p>
                                        <p className="text-xs text-text-muted">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-background rounded-xl border border-border">
                        <p className="text-xs text-text-muted font-mono">SYSTEM READY</p>
                        <p className="text-xs text-success font-bold flex items-center gap-1 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"/> WORKER NODES ACTIVE</p>
                    </div>
                </div>

                {/* Right: Active Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <StepContent key="1" title="Upload Dataset" desc="Select a CSV file for training.">
                                <UploadBox 
                                    file={datasetFile} 
                                    accept=".csv" 
                                    icon={FileText} 
                                    onSelect={(e) => handleFileSelect(e, 'dataset')} 
                                />
                                <NavButtons 
                                    canNext={!!datasetFile} 
                                    onNext={() => setCurrentStep(2)} 
                                />
                            </StepContent>
                        )}
                        {currentStep === 2 && (
                            <StepContent key="2" title="Upload Script" desc="Select your Python logic file.">
                                <UploadBox 
                                    file={scriptFile} 
                                    accept=".py" 
                                    icon={FileCode} 
                                    onSelect={(e) => handleFileSelect(e, 'script')} 
                                />
                                <NavButtons 
                                    canNext={!!scriptFile} 
                                    onBack={() => setCurrentStep(1)} 
                                    onNext={() => setCurrentStep(3)} 
                                />
                            </StepContent>
                        )}
                        {currentStep === 3 && (
                            <StepContent key="3" title="Ready to Launch" desc="Review configuration and initialize.">
                                <div className="space-y-4 mb-8">
                                    <SummaryItem icon={FileText} label="Dataset" value={datasetFile?.name} />
                                    <SummaryItem icon={Code} label="Script" value={scriptFile?.name} />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:bg-surface-hover transition-colors">Back</button>
                                    <button 
                                        onClick={handleLaunch} 
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary text-white rounded-xl font-bold py-3 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                                        {isSubmitting ? 'Initializing...' : 'Launch Mission'}
                                    </button>
                                </div>
                            </StepContent>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
function StepContent({ title, desc, children }) {
    return (
        <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="w-full max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-text-main mb-2">{title}</h3>
            <p className="text-text-muted mb-8">{desc}</p>
            {children}
        </motion.div>
    )
}

function UploadBox({ file, accept, icon: Icon, onSelect }) {
    return (
        <label className={`
            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all mb-8
            ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface-hover'}
        `}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted'}`}>
                {file ? <CheckCircle size={32} /> : <Icon size={32} />}
            </div>
            <p className="font-bold text-text-main text-lg mb-1">{file ? file.name : 'Click to Upload'}</p>
            <p className="text-sm text-text-muted">{file ? 'Ready for staging' : `Supported format: ${accept}`}</p>
            <input type="file" className="hidden" accept={accept} onChange={onSelect} />
        </label>
    )
}

function NavButtons({ canNext, onNext, onBack }) {
    return (
        <div className="flex gap-3">
            {onBack && <button onClick={onBack} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:bg-surface-hover transition-colors">Back</button>}
            <button 
                onClick={onNext} 
                disabled={!canNext}
                className="flex-1 bg-text-main text-white rounded-xl font-bold py-3 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/80 transition-all"
            >
                Continue
            </button>
        </div>
    )
}

function SummaryItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between p-4 bg-surface-hover rounded-xl border border-border">
            <div className="flex items-center gap-3">
                <Icon className="text-primary" size={20} />
                <span className="font-medium text-text-main">{label}</span>
            </div>
            <span className="text-sm text-text-muted">{value}</span>
        </div>
    )
}