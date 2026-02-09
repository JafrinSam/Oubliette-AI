import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, Loader, ArrowUpRight, ArrowRight, RefreshCw, Plus, Layers, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/jobs');
            setJobs(data);
        } catch (error) { console.error("Failed to fetch jobs", error); }
        finally { setLoading(false); }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.dataset?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6 pb-8">
            {/* Header & Filters */}
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
                        placeholder="Search jobs or datasets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border-none rounded-xl text-sm text-text-main focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-text-muted transition-all"
                    />
                </div>
                <div className="flex bg-background rounded-xl p-1 border border-border/50">
                    {['ALL', 'RUNNING', 'COMPLETED', 'FAILED'].map((status) => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-main'}`}>
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
                                <th className="px-6 py-4 font-bold">Mission / Model</th>
                                <th className="px-6 py-4 font-bold">Dataset</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Started</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredJobs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">No missions found.</td></tr>
                            ) : (
                                filteredJobs.map((job) => {
                                    // 🧠 LOGIC: Get Model Name from Relation OR Hyperparams
                                    const modelName = job.producedModelVersion?.model?.name
                                        || job.hyperparameters?._target_model_name
                                        || "Untitled Model";

                                    const targetVersion = job.producedModelVersion?.version
                                        || job.hyperparameters?._target_version
                                        || "?";

                                    return (
                                        <tr key={job.id} className="group hover:bg-surface-hover/50 transition-colors">
                                            {/* COLUMN 1: Model & ID */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors shadow-sm">
                                                        <Layers size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-text-main">{modelName}</span>
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-md font-bold">v{targetVersion}</span>
                                                        </div>
                                                        <span className="text-xs text-text-muted font-mono">{job.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* COLUMN 2: Dataset */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-main">
                                                        <Database size={14} className="text-text-muted" />
                                                        {job.dataset?.name || "Unknown Dataset"}
                                                    </div>
                                                    {job.dataset?.hash && (
                                                        <span className="text-[10px] font-mono text-text-muted pl-5">
                                                            {job.dataset.hash.substring(0, 10)}...
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4"><StatusBadge status={job.status} /></td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                                                    <Clock size={14} />
                                                    <span>{job.startedAt ? new Date(job.startedAt).toLocaleDateString() : '-'}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-primary transition-colors">
                                                    Details <ArrowUpRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
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
        CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-200',
    };
    const icons = {
        RUNNING: <Loader size={12} className="animate-spin" />,
        COMPLETED: <CheckCircle size={12} />,
        FAILED: <XCircle size={12} />,
        QUEUED: <Clock size={12} />,
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.QUEUED}`}>
            {icons[status] || <Clock size={12} />} {status}
        </span>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <Loader className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
}