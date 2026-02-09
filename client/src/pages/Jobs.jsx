import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Play, CheckCircle, XCircle, Loader, ArrowUpRight, Terminal, MoreHorizontal, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/jobs');
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.datasetHash?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Mission Control</h1>
                    <p className="text-text-muted mt-1">Manage and monitor your training operations.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchJobs} className="p-2.5 bg-surface border border-border rounded-xl hover:text-primary transition-colors text-text-muted">
                        <RefreshCw size={20} />
                    </button>
                    <Link to="/create-job" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                        <Plus size={18} /> Launch Mission
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-surface p-2 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Job ID or Hash..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border-none rounded-xl text-sm text-text-main focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-text-muted transition-all"
                    />
                </div>
                <div className="flex bg-background rounded-xl p-1 border border-border/50">
                    {['ALL', 'RUNNING', 'COMPLETED', 'FAILED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status
                                    ? 'bg-surface text-primary shadow-sm border border-border'
                                    : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-hover/50 text-xs text-text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4 font-bold">Mission</th>
                                <th className="px-6 py-4 font-bold">Dataset / Hash</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Started</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-text-muted">
                                        No missions found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr key={job.id} className="group hover:bg-surface-hover/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted group-hover:border-primary/50 group-hover:text-primary transition-colors shadow-sm">
                                                    <Terminal size={18} />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-bold text-text-main">{job.id}</span>
                                                    <span className="text-xs text-text-muted">Python Script</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded-md bg-background border border-border font-mono text-xs text-text-muted">
                                                    {job.datasetHash ? job.datasetHash.substring(0, 12) + '...' : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-text-muted">
                                                <Clock size={14} />
                                                <span>{job.startedAt ? new Date(job.startedAt).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/jobs/${job.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-primary transition-colors"
                                            >
                                                Details <ArrowUpRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
    const icons = {
        RUNNING: <Loader size={12} className="animate-spin" />,
        COMPLETED: <CheckCircle size={12} />,
        FAILED: <XCircle size={12} />,
        QUEUED: <Clock size={12} />
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.QUEUED}`}>
            {icons[status]} {status}
        </span>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-text-muted text-sm font-medium">Syncing Mission Data...</p>
            </div>
        </div>
    );
}