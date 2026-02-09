import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Terminal, ArrowLeft, Clock, Cpu, CheckCircle, XCircle, Loader, Database, Calendar, FileCode, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function JobDetail() {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const logsEndRef = useRef(null);

    useEffect(() => {
        fetchJobDetails();
        fetchLogs();
        const interval = setInterval(() => { fetchJobDetails(); fetchLogs(); }, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const { data } = await api.get(`/jobs/${id}`);
            setJob(data);
        } catch (error) { console.error("Failed to fetch job", error); } finally { setLoading(false); }
    };

    const fetchLogs = async () => {
        try {
            const { data } = await api.get(`/jobs/${id}/logs`);
            if (typeof data === 'string') setLogs(data.split('\n').filter(Boolean));
        } catch (error) { /* Logs might not be ready */ }
    };

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader className="animate-spin text-primary" /></div>;
    if (!job) return <div className="p-8 text-center text-error">Mission not found</div>;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/jobs" className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-border">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-text-main">{job.id}</h1>
                            <StatusBadge status={job.status} />
                        </div>
                        <p className="text-text-muted text-sm mt-0.5">Mission Telemetry & Logs</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata Panel */}
                <div className="space-y-6">
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                            <Cpu size={18} className="text-primary" /> Configuration
                        </h3>
                        <div className="space-y-4">
                             <MetaItem icon={Database} label="Dataset Hash" value={job.datasetHash} mono />
                             <MetaItem icon={FileCode} label="Script Type" value={job.scriptType || 'Python 3.10'} />
                             <MetaItem icon={Calendar} label="Started At" value={job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'} />
                             <MetaItem icon={Clock} label="Finished At" value={job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'} />
                        </div>
                    </div>
                </div>

                {/* Right: Terminal Panel */}
                <div className="lg:col-span-2">
                     <div className="bg-[#1e1e1e] rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col h-[600px]">
                        {/* Terminal Header */}
                        <div className="bg-[#252526] px-4 py-3 flex items-center justify-between border-b border-[#333]">
                            <div className="flex items-center gap-2">
                                <Terminal size={16} className="text-emerald-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console Output</span>
                            </div>
                            {job.status === 'RUNNING' && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded text-[10px] text-emerald-500 font-bold border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                                </div>
                            )}
                        </div>
                        
                        {/* Logs Content */}
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-300 space-y-1">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <div key={i} className="flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded">
                                    <span className="text-gray-600 select-none w-6 text-right">{i+1}</span>
                                    <span className="break-all">{log}</span>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                    <Terminal size={40} className="mb-4 opacity-50" />
                                    <p>Waiting for telemetry...</p>
                                </div>
                            )}
                            <div ref={logsEndRef} />
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

function MetaItem({ icon: Icon, label, value, mono }) {
    return (
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Icon size={14} /> <span>{label}</span>
            </div>
            <div className={`text-sm text-text-main font-medium ${mono ? 'font-mono text-xs bg-surface-hover px-2 py-1 rounded truncate max-w-[150px]' : ''}`}>
                {value || 'N/A'}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        RUNNING: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-200',
        FAILED: 'bg-red-500/10 text-red-600 border-red-200',
        QUEUED: 'bg-amber-500/10 text-amber-600 border-amber-200',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
}