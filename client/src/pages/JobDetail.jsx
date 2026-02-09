import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Terminal, ArrowLeft, Clock, Cpu, CheckCircle, XCircle,
    Loader, Database, Calendar, FileCode, Play, StopCircle, RefreshCw, Layers
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

// Point to your API Server URL
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [job, setJob] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    const logsEndRef = useRef(null);
    const socketRef = useRef(null);

    // 1. Initial Data Fetch
    useEffect(() => {
        fetchJobDetails();
        // Load persisted logs first
        fetchInitialLogs();
    }, [id]);

    // 2. Setup Socket.io for LIVE LOGS
    useEffect(() => {
        // Only connect if job is running or queued
        if (job && (job.status === 'RUNNING' || job.status === 'QUEUED')) {
            if (!socketRef.current) {
                socketRef.current = io(SOCKET_URL);

                // Join the "Room" for this specific Job ID
                socketRef.current.emit('join-job', id);

                socketRef.current.on('log', (message) => {
                    setIsLive(true);
                    setLogs((prev) => [...prev, message]);
                });
            }
        }

        // Cleanup
        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-job', id);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [id, job?.status]); // Re-run if status changes

    // Auto-scroll to bottom of terminal
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const fetchJobDetails = async () => {
        try {
            const { data } = await api.get(`/jobs/${id}`);
            setJob(data);
        } catch (error) { console.error("Failed to fetch job"); }
        finally { setLoading(false); }
    };

    const fetchInitialLogs = async () => {
        try {
            const { data } = await api.get(`/jobs/${id}/logs`);
            if (typeof data === 'string') {
                // Split lines and remove empty ones
                setLogs(data.split('\n').filter(line => line.trim() !== ''));
            }
        } catch (error) { /* Logs might not exist yet */ }
    };

    // --- ACTIONS ---

    const handleStop = async () => {
        if (!confirm("Are you sure you want to kill this training process?")) return;
        try {
            await api.post(`/jobs/${id}/stop`);
            toast.success("Signal Sent", "Stopping container...");
            fetchJobDetails(); // Refresh status immediately
        } catch (error) {
            toast.error("Stop Failed", error.response?.data?.error);
        }
    };

    const handleRestart = async () => {
        try {
            // This endpoint creates a new job with version + 1
            const { data } = await api.post(`/jobs/${id}/restart`);
            toast.success("Mission Restarted", `New Job ID: ${data.newJobId}`);
            // Navigate to the new job page
            navigate(`/jobs/${data.newJobId}`);
        } catch (error) {
            toast.error("Restart Failed", error.response?.data?.error);
        }
    };

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader className="animate-spin text-primary" /></div>;
    if (!job) return <div className="p-8 text-center text-error">Mission not found</div>;

    return (
        <div className="space-y-6 pb-8">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/jobs" className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text-main border border-transparent hover:border-border">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-text-main">{job.id.substring(0, 8)}...</h1>
                            <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                            <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
                            {job.runtime && <span>• {job.runtime.name}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* STOP BUTTON */}
                    {(job.status === 'RUNNING' || job.status === 'QUEUED') && (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
                        >
                            <StopCircle size={18} /> Abort Mission
                        </button>
                    )}

                    {/* RESTART BUTTON */}
                    {['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status) && (
                        <button
                            onClick={handleRestart}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
                        >
                            <RefreshCw size={18} /> Restart (v{job.producedModelVersion ? job.producedModelVersion.version + 1 : '?'})
                        </button>
                    )}
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
                            <MetaItem icon={Database} label="Dataset" value={job.dataset.name} />
                            <MetaItem icon={FileCode} label="Script" value={job.script.name} />
                            {job.producedModelVersion && (
                                <div className="p-3 bg-surface-hover rounded-lg border border-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Layers size={14} className="text-primary" />
                                        <span className="text-xs font-bold text-text-main">Output Model</span>
                                    </div>
                                    <p className="text-sm font-mono text-text-muted">{job.producedModelVersion.model.name}</p>
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                                        Version {job.producedModelVersion.version}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Terminal Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-[#1e1e1e] rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col h-[600px]">
                        <div className="bg-[#252526] px-4 py-3 flex items-center justify-between border-b border-[#333]">
                            <div className="flex items-center gap-2">
                                <Terminal size={16} className="text-emerald-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console Output</span>
                            </div>
                            {job.status === 'RUNNING' && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded text-[10px] text-emerald-500 font-bold border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE STREAM
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <div key={i} className="flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded group">
                                    <span className="text-gray-600 select-none w-8 text-right opacity-50 group-hover:opacity-100">{i + 1}</span>
                                    <span className="break-all whitespace-pre-wrap">{log}</span>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                    <Terminal size={40} className="mb-4 opacity-50" />
                                    <p>Waiting for logs...</p>
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

function MetaItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Icon size={14} /> <span>{label}</span>
            </div>
            <div className="text-sm text-text-main font-medium truncate max-w-[150px]">
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
        CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-200',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.CANCELLED}`}>{status}</span>;
}