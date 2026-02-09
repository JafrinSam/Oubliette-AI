import { Activity, Server, HardDrive, Cpu, TrendingUp, Clock, MoreHorizontal, Calendar, ArrowUpRight, Download, RefreshCw, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data for Charts
const chartData = [
    { name: 'Mon', jobs: 4, queue: 2 },
    { name: 'Tue', jobs: 3, queue: 4 },
    { name: 'Wed', jobs: 7, queue: 1 },
    { name: 'Thu', jobs: 5, queue: 3 },
    { name: 'Fri', jobs: 9, queue: 5 },
    { name: 'Sat', jobs: 6, queue: 2 },
    { name: 'Sun', jobs: 4, queue: 1 },
];

const sparklineData = [
    { value: 10 }, { value: 15 }, { value: 8 }, { value: 12 }, { value: 20 }, { value: 16 }, { value: 25 }
];

export default function Dashboard() {
    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Dashboard</h1>
                    <p className="text-text-muted mt-1">Overview of system performance and AI missions.</p>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-muted hover:text-text-main hover:border-primary/50 transition-colors shadow-sm">
                        <Calendar size={16} />
                        <span>Last 30 Days</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                        <RefreshCw size={16} />
                        <span>Sync Data</span>
                    </button>
                </div>
            </div>

            {/* --- METRICS ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Primary Gradient (The "My Balance" equivalent) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="col-span-1 bg-gradient-to-br from-[#FF6B35] to-[#FF9F43] rounded-2xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                                <Activity size={24} className="text-white" />
                            </div>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold flex items-center gap-1">
                                <TrendingUp size={12} /> +12%
                            </div>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Active Jobs</p>
                        <h3 className="text-4xl font-bold mb-4">3</h3>

                        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-white/80 transition-colors">
                            View All Jobs <ArrowUpRight size={16} />
                        </Link>
                    </div>
                    {/* Decorative Background Pattern */}
                    <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <Activity size={160} />
                    </div>
                </motion.div>

                {/* Card 2: Queue Size with Sparkline */}
                <MetricCard
                    title="Queue Size"
                    value="12"
                    icon={Server}
                    trend="+5%"
                    data={sparklineData}
                    delay={0.1}
                />

                {/* Card 3: Storage */}
                <MetricCard
                    title="Storage Used"
                    value="45.2 GB"
                    icon={HardDrive}
                    trend="+8%"
                    data={sparklineData}
                    color="#10B981" // Custom sparkline color
                    delay={0.2}
                />

                {/* Card 4: Completed */}
                <MetricCard
                    title="Completed Missions"
                    value="127"
                    icon={Cpu}
                    trend="+23%"
                    data={sparklineData}
                    delay={0.3}
                />
            </div>

            {/* --- ANALYTICS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Large Chart Area (The "Cash Flow" equivalent) */}
                <div className="lg:col-span-2 bg-surface rounded-3xl p-6 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-text-main">Job Analytics</h3>
                            <p className="text-sm text-text-muted">Processing volume over time</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-hover text-text-muted hover:text-primary transition-colors">
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-surface-hover)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-surface)',
                                        borderColor: 'var(--color-border)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-card)'
                                    }}
                                />
                                <Bar
                                    dataKey="jobs"
                                    fill="var(--color-primary)"
                                    radius={[6, 6, 0, 0]}
                                />
                                <Bar
                                    dataKey="queue"
                                    fill="var(--color-surface-hover)"
                                    radius={[6, 6, 0, 0]}
                                    stackId="a" // If you want stacked, or remove for side-by-side
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Sidebar: System Health (The "Recent Activities" vertical look) */}
                <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-text-main mb-6">System Health</h3>

                    <div className="space-y-6 relative flex-1">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-border/50"></div>

                        {[
                            { title: 'System Initialized', desc: 'Core services online', time: '10:00 AM', status: 'success' },
                            { title: 'Worker Node #1', desc: 'Connected successfully', time: '10:05 AM', status: 'primary' },
                            { title: 'Upload Blocked', desc: 'Malware detected in script', time: '10:15 AM', status: 'error' },
                            { title: 'Job #8f92 Started', desc: 'Processing dataset', time: '10:20 AM', status: 'neutral' },
                        ].map((event, i) => (
                            <div key={i} className="relative pl-10 group cursor-default">
                                <div className={`absolute left-[14px] top-1.5 w-3 h-3 rounded-full border-2 border-surface z-10
                                    ${event.status === 'success' ? 'bg-success' :
                                        event.status === 'primary' ? 'bg-primary' :
                                            event.status === 'error' ? 'bg-error' : 'bg-text-muted'} 
                                    group-hover:scale-125 transition-transform duration-200`}
                                />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-text-main">{event.title}</p>
                                        <p className="text-xs text-text-muted mt-0.5">{event.desc}</p>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-2 py-1 rounded-md">
                                        {event.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- RECENT ACTIVITY TABLE --- */}
            <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-main">Recent Missions</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-surface-hover rounded-lg text-text-muted transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-hover/50 text-xs text-text-muted uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Job ID</th>
                                <th className="px-6 py-4 font-semibold">Dataset</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Duration</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { id: 'job-1234', hash: '8f92...a1b2', status: 'RUNNING', duration: '2m 15s', type: 'Python' },
                                { id: 'job-5678', hash: 'c3d4...e5f6', status: 'COMPLETED', duration: '45m 12s', type: 'Go' },
                                { id: 'job-9012', hash: '7a8b...9c0d', status: 'FAILED', duration: '12s', type: 'Python' },
                                { id: 'job-3456', hash: '1e2f...3a4b', status: 'QUEUED', duration: '-', type: 'Python' },
                            ].map((job, i) => (
                                <tr key={i} className="group hover:bg-surface-hover/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-hover border border-border flex items-center justify-center text-text-main group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                                <Terminal size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main">{job.id}</p>
                                                <p className="text-xs text-text-muted">{job.type} Script</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-text-muted bg-surface-hover px-2 py-1 rounded-md border border-border">
                                            {job.hash}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-muted">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} /> {job.duration}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function MetricCard({ title, value, icon: Icon, trend, data, color = "#FF6B35", delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-surface rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-surface-hover rounded-xl text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Icon size={24} />
                </div>
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-md">
                    {trend}
                </span>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-text-main mb-1">{value}</h3>
                    <p className="text-sm text-text-muted">{title}</p>
                </div>
                {/* Mini Sparkline Chart */}
                <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fill={color}
                                fillOpacity={0.1}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        RUNNING: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-200',
        FAILED: 'bg-red-500/10 text-red-600 border-red-200',
        QUEUED: 'bg-amber-500/10 text-amber-600 border-amber-200',
    };

    // Icon mapping
    const icons = {
        RUNNING: <Activity size={12} className="animate-pulse" />,
        COMPLETED: <Clock size={12} />,
        FAILED: <Activity size={12} />,
        QUEUED: <Clock size={12} />
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
            {icons[status]}
            {status}
        </span>
    );
}