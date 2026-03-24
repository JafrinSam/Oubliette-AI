import { useState, useEffect, useRef } from 'react';
import {
    Book, Shield, Lock, Users, PlayCircle, Activity,
    Terminal, Copy, CheckCircle, AlertTriangle, Info,
    ChevronRight, Package, Cpu, Database, Server,
    GitBranch, Fingerprint, Eye, Zap, FileText,
    BarChart3, Network, Box, UploadCloud, WifiOff,
    Layers, ImageIcon, ArrowRight, Hash, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── NAV SECTIONS ───────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'intro',        label: 'Introduction',       icon: Book },
    { id: 'docker',       label: 'Docker Guide',       icon: Box },
    { id: 'architecture', label: 'Architecture',       icon: Shield },
    { id: 'rbac',         label: 'Access Control',     icon: Users },
    { id: 'pipeline',     label: 'Run a Pipeline',     icon: PlayCircle },
    { id: 'telemetry',    label: 'Security Metrics',   icon: Activity },
];

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function Docs() {
    const [activeSection, setActiveSection] = useState('intro');
    const sectionRefs = useRef({});
    const navRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { rootMargin: '-15% 0px -75% 0px' }
        );
        Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        const el = sectionRefs.current[id];
        if (!el) return;
        const offset = navRef.current?.offsetHeight || 60;
        const top = el.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    const setRef = (id) => (el) => { sectionRefs.current[id] = el; };

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6 space-y-0">

            {/* ── HERO ──────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 pb-10 space-y-5"
            >
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-muted uppercase tracking-widest">
                    <Fingerprint size={11} className="text-primary" /> Zero-Trust MLOps Framework
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-bold text-text-main leading-tight tracking-tight">
                        Oubliette-AI <span className="text-primary">Documentation</span>
                    </h1>
                    <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-3xl">
                        An air-gapped, cryptographically auditable ML execution platform for sovereign sectors where
                        data exfiltration or model theft is mission-critical.
                    </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: '3-Tier Containment',       c: '#10B981' },
                        { label: 'Cryptographic Provenance', c: '#6366F1' },
                        { label: 'Zero-Trust RBAC',          c: '#F59E0B' },
                        { label: 'Air-Gapped Sandbox',       c: '#EF4444' },
                    ].map(({ label, c }) => (
                        <span key={label} className="text-xs font-semibold px-3 py-1 rounded-full border"
                            style={{ color: c, borderColor: `${c}35`, background: `${c}12` }}>
                            {label}
                        </span>
                    ))}
                </div>
            </motion.div>

            {/* ── STICKY TOP NAV ────────────────────────────────────── */}
            <div ref={navRef} className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3
                bg-background/90 backdrop-blur-md border-b border-border mb-10">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {SECTIONS.map(({ id, label, icon: Icon }) => {
                        const active = activeSection === id;
                        return (
                            <button
                                key={id}
                                onClick={() => scrollTo(id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                                }`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── CONTENT SECTIONS ──────────────────────────────────── */}
            <div className="space-y-20">

                {/* ═══════════════════════════════════════╗
                    SECTION 1 · INTRODUCTION               ║
                    ══════════════════════════════════════ */}
                <Section id="intro" ref={setRef('intro')}>
                    <SectionHeader icon={Book} number="01" title="Introduction to Zero-Trust MLOps" color="#6366F1" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocCard>
                            <CardTitle icon={AlertTriangle} color="#EF4444">The Problem</CardTitle>
                            <p className="text-text-muted text-sm leading-relaxed">
                                ML models like <Chip>.pkl</Chip> and <Chip>.h5</Chip> are{' '}
                                <strong className="text-text-main">executable code architectures</strong>, not just data.
                                Standard MLOps platforms operate on a "trusted tenant" model — granting execution
                                environments unrestricted network and filesystem access.
                            </p>
                            <p className="text-text-muted text-sm leading-relaxed mt-2">
                                This creates direct exposure to <Chip color="red">Arbitrary Code Execution</Chip> and{' '}
                                <Chip color="red">supply-chain poisoning</Chip>.
                            </p>
                        </DocCard>

                        <DocCard>
                            <CardTitle icon={CheckCircle} color="#10B981">The Solution</CardTitle>
                            <p className="text-text-muted text-sm leading-relaxed">
                                Oubliette-AI <strong className="text-text-main">assumes all uploaded code is malicious</strong> until
                                proven otherwise — both mathematically (AST) and physically (air-gap).
                                Micro-segmentation and least-privilege are enforced at every pipeline stage.
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-text-muted">
                                <Users size={12} className="text-primary" />
                                Built for defence, healthcare, finance, and sovereign data sectors.
                            </div>
                        </DocCard>
                    </div>

                    {/* How it connects together */}
                    <div className="rounded-2xl border border-border bg-surface p-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">End-to-End Flow</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { label: 'Upload Script & Dataset', icon: UploadCloud, c: '#6366F1' },
                                { label: 'AST Firewall Scan',       icon: Shield,     c: '#EF4444' },
                                { label: 'Air-Gapped Container',    icon: WifiOff,    c: '#10B981' },
                                { label: 'CAS Storage',             icon: Hash,       c: '#F59E0B' },
                                { label: 'Signed ML-BOM Export',    icon: Fingerprint, c: '#FF6B35' },
                            ].map(({ label, icon: Icon, c }, i, arr) => (
                                <div key={label} className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                                        style={{ background: `${c}10`, borderColor: `${c}30` }}>
                                        <Icon size={13} style={{ color: c }} />
                                        <span className="text-xs font-medium text-text-main">{label}</span>
                                    </div>
                                    {i < arr.length - 1 && <ArrowRight size={12} className="text-text-muted shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ═══════════════════════════════════════╗
                    SECTION 2 · DOCKER GUIDE               ║
                    ══════════════════════════════════════ */}
                <Section id="docker" ref={setRef('docker')}>
                    <SectionHeader icon={Box} number="02" title="Building & Adding Docker Runtime Images" color="#10B981" />

                    <AlertBox type="warning" icon={AlertTriangle}>
                        <strong>Air-Gap Notice:</strong> The Oubliette execution environment has{' '}
                        <Chip color="amber">NetworkMode: none</Chip> — <code>pip install</code> and{' '}
                        <code>docker pull</code> will fail inside training containers. You must use the
                        "Build Outside, Ship Inside" workflow below.
                    </AlertBox>

                    {/* Golden Rules */}
                    <DocCard>
                        <CardTitle icon={Shield} color="#10B981">3 Golden Rules for Every Image</CardTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                            {[
                                { n: '1', title: 'Python 3.8+', desc: 'The wrapper script requires Python 3.8 or newer.', c: '#10B981' },
                                { n: '2', title: 'Install bandit', desc: 'pip install bandit — required by the AST firewall.', c: '#6366F1' },
                                { n: '3', title: 'User trainee (UID 1000)', desc: 'useradd -m -u 1000 trainee. Must switch to this user.', c: '#F59E0B' },
                            ].map(({ n, title, desc, c }) => (
                                <div key={n} className="rounded-xl p-4 border" style={{ background: `${c}08`, borderColor: `${c}25` }}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm mb-3"
                                        style={{ background: `${c}20`, color: c }}>
                                        {n}
                                    </div>
                                    <p className="font-bold text-text-main text-sm mb-1">{title}</p>
                                    <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </DocCard>

                    {/* Dockerfile examples */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-text-main flex items-center gap-2">
                            <Layers size={15} className="text-primary" /> Dockerfile Templates
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Option A: Classical ML */}
                            <div className="rounded-2xl border border-border overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={13} className="text-primary" />
                                        <span className="text-xs font-bold text-text-main">Option A — Classical ML (CPU)</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-muted">sklearn · xgboost · lightgbm</span>
                                </div>
                                <CodeBlock language="Dockerfile" code={`FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# System deps (libgomp1 required for LightGBM)
RUN apt-get update && apt-get install -y \\
    build-essential libgomp1 \\
    && rm -rf /var/lib/apt/lists/*

# ML stack — add your own libraries here
RUN pip3 install --no-cache-dir \\
    pandas numpy scikit-learn \\
    xgboost lightgbm joblib \\
    matplotlib polars \\
    bandit          # ← REQUIRED by Oubliette

# ── MANDATORY ──────────────────────────
RUN useradd -m -u 1000 trainee
WORKDIR /home/trainee/app
USER trainee
# ───────────────────────────────────────`} />
                            </div>

                            {/* Option B: Deep Learning */}
                            <div className="rounded-2xl border border-border overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
                                    <div className="flex items-center gap-2">
                                        <Zap size={13} style={{ color: '#6366F1' }} />
                                        <span className="text-xs font-bold text-text-main">Option B — Deep Learning (GPU)</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-muted">PyTorch · CUDA 11.8</span>
                                </div>
                                <CodeBlock language="Dockerfile" code={`FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \\
    python3 python3-pip git \\
    && rm -rf /var/lib/apt/lists/*

# Deep-learning stack
RUN pip3 install --no-cache-dir \\
    torch torchvision torchaudio \\
    --index-url https://download.pytorch.org/whl/cu118
RUN pip3 install --no-cache-dir \\
    pandas numpy scikit-learn \\
    transformers datasets \\
    bandit          # ← REQUIRED by Oubliette

# ── MANDATORY ──────────────────────────
RUN useradd -m -u 1000 trainee
WORKDIR /home/trainee/app
USER trainee
# ───────────────────────────────────────`} />
                            </div>
                        </div>

                        {/* Option C: NLP / Transformers */}
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
                                <div className="flex items-center gap-2">
                                    <FileText size={13} style={{ color: '#F59E0B' }} />
                                    <span className="text-xs font-bold text-text-main">Option C — NLP / Computer Vision (HuggingFace)</span>
                                </div>
                                <span className="text-[10px] font-mono text-text-muted">transformers · timm · Pillow</span>
                            </div>
                            <CodeBlock language="Dockerfile" code={`FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y build-essential libgl1 libglib2.0-0 \\
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \\
    torch torchvision transformers datasets timm \\
    Pillow opencv-python-headless accelerate \\
    scikit-learn pandas numpy bandit  # ← bandit REQUIRED

RUN useradd -m -u 1000 trainee
WORKDIR /home/trainee/app
USER trainee`} />
                        </div>
                    </div>

                    {/* Build → Export → Register steps */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-text-main flex items-center gap-2 mt-2">
                            <ArrowRight size={15} className="text-primary" /> Build, Export & Register Workflow
                        </h3>

                        {[
                            {
                                step: '1', icon: Box, color: '#6366F1', title: 'Build the image on an internet-connected machine',
                                commands: [
                                    { label: 'Build', cmd: 'docker build -t oubliette/trainer-sklearn:v1 -f Dockerfile .' },
                                    { label: 'Verify', cmd: 'docker images | grep oubliette' },
                                ],
                                note: 'Choose a descriptive tag — you will use this to identify the runtime inside Oubliette.'
                            },
                            {
                                step: '2', icon: HardDrive, color: '#F59E0B', title: 'Export to a portable .tar file',
                                commands: [
                                    { label: 'Save', cmd: 'docker save -o oubliette-sklearn-v1.tar oubliette/trainer-sklearn:v1' },
                                ],
                                note: 'Format your USB drive as ExFAT or NTFS — raw FAT32 has a 4 GB file limit.'
                            },
                            {
                                step: '3', icon: Server, color: '#10B981', title: 'Load the tarball on the secure server',
                                commands: [
                                    { label: 'Load', cmd: 'docker load -i oubliette-sklearn-v1.tar' },
                                    { label: 'Check', cmd: 'docker images | grep oubliette' },
                                ],
                                note: 'Run this command on the server where the Oubliette worker runs.'
                            },
                            {
                                step: '4', icon: UploadCloud, color: '#FF6B35', title: 'Register in the Oubliette Runtime Manager',
                                commands: [],
                                note: null,
                                ui: true,
                            },
                        ].map(({ step, icon: Icon, color, title, commands, note, ui }) => (
                            <div key={step} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}25` }}>
                                <div className="flex items-center gap-3 px-5 py-3 border-b"
                                    style={{ background: `${color}08`, borderColor: `${color}20` }}>
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{ background: `${color}20`, color }}>
                                        {step}
                                    </span>
                                    <Icon size={14} style={{ color }} />
                                    <span className="font-semibold text-sm text-text-main">{title}</span>
                                </div>
                                <div className="px-5 py-4 space-y-3 bg-surface">
                                    {commands.map(({ label, cmd }) => (
                                        <div key={cmd}>
                                            <span className="text-[10px] font-mono uppercase text-text-muted mb-1 block">{label}</span>
                                            <ShellLine code={cmd} />
                                        </div>
                                    ))}
                                    {ui && (
                                        <div className="space-y-2 text-sm text-text-muted">
                                            <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                                <li>Navigate to <a href="/runtimes" className="text-primary font-semibold hover:underline">Runtimes</a> in the Oubliette sidebar.</li>
                                                <li>Click <strong className="text-text-main">"Sync with Docker"</strong> — this scans all local Docker images.</li>
                                                <li>Your new image appears in the list. Click <strong className="text-text-main">"Register"</strong> to make it available for jobs.</li>
                                                <li>When creating a job, select this runtime from the <strong className="text-text-main">Runtime Image</strong> dropdown.</li>
                                            </ol>
                                        </div>
                                    )}
                                    {note && (
                                        <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl mt-1"
                                            style={{ background: `${color}08`, border: `1px solid ${color}20`, color }}>
                                            <Info size={11} className="mt-0.5 shrink-0" />
                                            <span>{note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Script contract */}
                    <DocCard>
                        <CardTitle icon={FileText} color="#FF6B35">Train Script Contract</CardTitle>
                        <p className="text-text-muted text-sm mb-3">
                            Your <Chip>.py</Chip> script must expose exactly this function signature. The platform calls it after the AST scan passes:
                        </p>
                        <CodeBlock language="python" code={`def train(dataset_path, save_path, hyperparameters, dataset_type):
    """
    Parameters
    ----------
    dataset_path    : str   – absolute path to the dataset file inside the container
    save_path       : str   – absolute path to /outputs/ — save ALL model files here
    hyperparameters : dict  – key/value params you set when creating the job
    dataset_type    : str   – e.g. 'text/csv', 'application/zip'

    Returns
    -------
    dict  – metrics to store (e.g. {"accuracy": 0.97, "loss": 0.04})
    """
    import pandas as pd, joblib, os
    from sklearn.ensemble import GradientBoostingClassifier

    df = pd.read_csv(dataset_path)
    X, y = df.drop('label', axis=1), df['label']

    n_est = int(hyperparameters.get('n_estimators', 100))
    model = GradientBoostingClassifier(n_estimators=n_est)
    model.fit(X, y)

    # ← Always save to save_path, not a hardcoded path
    joblib.dump(model, os.path.join(save_path, 'model.pkl'))

    return {"accuracy": round(model.score(X, y), 4)}`} />
                    </DocCard>
                </Section>

                {/* ═══════════════════════════════════════╗
                    SECTION 3 · ARCHITECTURE               ║
                    ══════════════════════════════════════ */}
                <Section id="architecture" ref={setRef('architecture')}>
                    <SectionHeader icon={Shield} number="03" title="Three-Tier Containment Architecture" color="#10B981" />

                    {/* Architecture placeholder */}
                    <ImagePlaceholder
                        icon={Network}
                        label="End-to-End System Architecture Flowchart"
                        description="Upload → AST Firewall → Air-Gapped Docker Container → CAS → Model Registry"
                    />

                    <div className="space-y-3">
                        {[
                            {
                                tier: '01', color: '#6366F1', icon: FileText, title: 'Pre-Execution AST Firewall',
                                body: <>Scripts are parsed into <Chip color="indigo">Abstract Syntax Trees</Chip> before the Python
                                    runtime is ever invoked. Unsafe primitives (<Chip>eval()</Chip>, <Chip>exec()</Chip>) are blocked.
                                    Depth is capped at <Chip color="indigo">80 levels</Chip> to prevent complexity DoS.
                                    Unicode homoglyphs are canonicalised via <Chip color="indigo">NFKC normalization</Chip>
                                    to prevent scanner bypass attacks.</>
                            },
                            {
                                tier: '02', color: '#10B981', icon: WifiOff, title: 'Air-Gapped Ephemeral Runtime',
                                body: <>Training runs inside Docker with <Chip color="green">NetworkMode: none</Chip> and
                                    <Chip color="green">CapDrop: ['ALL']</Chip>. The container is destroyed after execution.
                                    The decrypted script file is written with <Chip color="green">chmod 0o600</Chip> and
                                    mounted read-only — it never touches the network.</>
                            },
                            {
                                tier: '03', color: '#F59E0B', icon: Fingerprint, title: 'Cryptographic Provenance — CAS & ML-BOM',
                                body: <>Datasets are content-addressed via <Chip color="amber">SHA-256</Chip> (O(1) dedup).
                                    Exports include a signed <Chip color="amber">CycloneDX 1.6 ML-BOM</Chip> — a Merkle-like
                                    receipt that mathematically binds the model to its exact script and dataset hash.
                                    Verification is possible offline with the bundled RSA public key.</>
                            },
                        ].map(({ tier, color, icon: Icon, title, body }) => (
                            <div key={tier} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}25` }}>
                                <div className="flex items-center gap-3 px-5 py-3 border-b"
                                    style={{ background: `${color}08`, borderColor: `${color}20` }}>
                                    <span className="text-[10px] font-mono font-bold" style={{ color }}>TIER {tier}</span>
                                    <Icon size={13} style={{ color }} />
                                    <span className="font-semibold text-sm text-text-main">{title}</span>
                                </div>
                                <p className="text-text-muted text-sm leading-relaxed px-5 py-4 bg-surface">{body}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ═══════════════════════════════════════╗
                    SECTION 4 · RBAC                       ║
                    ══════════════════════════════════════ */}
                <Section id="rbac" ref={setRef('rbac')}>
                    <SectionHeader icon={Users} number="04" title="Role-Based Access Control" color="#F59E0B" />

                    <p className="text-text-muted leading-relaxed text-sm">
                        All API endpoints are protected by <Chip color="amber">JWT middleware</Chip>.
                        Each role enforces strict separation of duties — the ownership check{' '}
                        <code className="text-xs font-mono text-text-main bg-surface-hover px-1.5 py-0.5 rounded">ownerId === req.user.id</code>{' '}
                        is evaluated on every resource-accessing request.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                role: 'DATA_SCIENTIST', color: '#10B981', icon: Cpu,
                                can: ['Upload datasets & scripts', 'Create training jobs', 'Download own model artifacts', 'View own job logs'],
                                cannot: 'Cannot access others\' resources (BOLA-protected)',
                            },
                            {
                                role: 'SECURITY_AUDITOR', color: '#6366F1', icon: Eye,
                                can: ['Read-only access to all jobs', 'Review AST firewall logs', 'Audit CycloneDX ML-BOMs', 'Trigger Red-Team tests'],
                                cannot: 'Cannot create jobs or modify any resource',
                            },
                            {
                                role: 'ML_ADMIN', color: '#FF6B35', icon: Shield,
                                can: ['Manage all users & roles', 'Access every resource', 'Deploy verified models', 'Adjust firewall policies'],
                                cannot: 'Full audit trail recorded on all actions',
                            },
                        ].map(({ role, color, icon: Icon, can, cannot }) => (
                            <div key={role} className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: `${color}25` }}>
                                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ background: `${color}10`, borderColor: `${color}20` }}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                                        <Icon size={14} style={{ color }} />
                                    </div>
                                    <code className="text-xs font-bold font-mono" style={{ color }}>{role}</code>
                                </div>
                                <div className="px-4 py-4 space-y-2 flex-1 bg-surface">
                                    {can.map((p) => (
                                        <div key={p} className="flex items-start gap-2 text-xs text-text-muted">
                                            <CheckCircle size={11} className="mt-0.5 shrink-0" style={{ color }} />
                                            <span>{p}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2.5 border-t text-[11px] text-text-muted italic"
                                    style={{ borderColor: `${color}15`, background: `${color}06` }}>
                                    {cannot}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ═══════════════════════════════════════╗
                    SECTION 5 · PIPELINE                   ║
                    ══════════════════════════════════════ */}
                <Section id="pipeline" ref={setRef('pipeline')}>
                    <SectionHeader icon={PlayCircle} number="05" title="Executing a Secure Pipeline" color="#FF6B35" />

                    <div className="space-y-3">
                        {[
                            {
                                step: 1, icon: Database, color: '#6366F1', title: 'Ingest Dataset & Script',
                                body: <>Go to <NavLink href="/upload">Upload Portal</NavLink>. Upload a dataset
                                    (<Chip color="indigo">.csv</Chip>, <Chip color="indigo">.tsv</Chip>,{' '}
                                    <Chip color="indigo">.zip</Chip>) and a Python training script.
                                    Both are SHA-256 hashed, deduplicated in MinIO, and the script is
                                    AES-256-GCM encrypted at rest.</>,
                                tip: 'File type is validated via magic bytes — renaming a .sh to .csv will be rejected.',
                            },
                            {
                                step: 2, icon: PlayCircle, color: '#F59E0B', title: 'Create a Training Job',
                                body: <>Go to <NavLink href="/create-job">Create Job</NavLink>. Select your
                                    owned dataset, script, and a registered runtime image. Set hyperparameters
                                    (they are passed as a dict to your <Chip color="amber">train()</Chip> function).
                                    Choose to create a new model or add a new version to an existing one.</>,
                                tip: 'JSON params are validated server-side — malformed JSON returns a 400 error.',
                            },
                            {
                                step: 3, icon: Terminal, color: '#10B981', title: 'Monitor Live Logs',
                                body: <>Open the <NavLink href="/jobs">Job Detail</NavLink> page.
                                    Logs stream over an authenticated <Chip color="green">Socket.IO</Chip> WebSocket
                                    in real time. Status progresses:{' '}
                                    <Chip color="green">QUEUED → RUNNING → COMPLETED</Chip>.
                                    You can stop the job at any time (sends SIGKILL to the container).</>,
                                tip: 'The Socket.IO connection uses your JWT token — unauthenticated connections are rejected.',
                            },
                            {
                                step: 4, icon: Package, color: '#FF6B35', title: 'Export & Verify',
                                body: <>Go to <NavLink href="/models">Model Registry</NavLink>.
                                    Check your model's <Chip color="orange">Zero-Trust Resilience Score</Chip>.
                                    Download the <Chip color="orange">.zip</Chip> artifact — it contains your model files,
                                    a signed <strong className="text-text-main">CycloneDX 1.6 ML-BOM</strong>,
                                    and an RSA public key for offline verification.</>,
                                tip: 'A score of 1.00 = perfect: AST passed, no network access, all red-team tests denied.',
                            },
                        ].map(({ step, icon: Icon, color, title, body, tip }) => (
                            <div key={step} className="flex gap-3 sm:gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                        style={{ background: `${color}15`, color, border: `2px solid ${color}35` }}>
                                        {step}
                                    </div>
                                    {step < 4 && <div className="w-px flex-1 mt-2" style={{ background: `${color}20` }} />}
                                </div>
                                <div className="pb-5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={14} style={{ color }} />
                                        <h3 className="font-bold text-text-main text-sm">{title}</h3>
                                    </div>
                                    <p className="text-text-muted text-sm leading-relaxed">{body}</p>
                                    <div className="mt-2.5 flex items-start gap-2 text-xs px-3 py-2 rounded-xl"
                                        style={{ background: `${color}08`, border: `1px solid ${color}20`, color }}>
                                        <Info size={11} className="mt-0.5 shrink-0" />
                                        <span>{tip}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ═══════════════════════════════════════╗
                    SECTION 6 · TELEMETRY                  ║
                    ══════════════════════════════════════ */}
                <Section id="telemetry" ref={setRef('telemetry')}>
                    <SectionHeader icon={Activity} number="06" title="Security Telemetry & Red-Teaming" color="#6366F1" />

                    <ImagePlaceholder
                        icon={BarChart3}
                        label="AST Firewall — Confusion Matrix"
                        description="True-positive / false-negative rates for the multi-head AST + Bandit scanner pipeline"
                    />

                    {/* ZT Score */}
                    <DocCard>
                        <CardTitle icon={Zap} color="#6366F1">Zero-Trust Resilience Score</CardTitle>

                        <div className="rounded-xl py-5 text-center my-4"
                            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <p className="font-mono text-3xl font-bold"
                                style={{ color: '#a5b4fc', textShadow: '0 0 24px rgba(99,102,241,0.45)' }}>
                                ZT<sub className="text-lg">res</sub> = αA + βN + γR
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                            {[
                                { v: 'A', w: 'α = 0.4', label: 'AST Firewall AUROC',         c: '#10B981' },
                                { v: 'N', w: 'β = 0.4', label: 'Network Isolation (0 or 1)', c: '#6366F1' },
                                { v: 'R', w: 'γ = 0.2', label: 'Red-Team Denial Rate',       c: '#F59E0B' },
                            ].map(({ v, w, label, c }) => (
                                <div key={v} className="rounded-xl p-3 flex flex-col gap-1"
                                    style={{ background: `${c}10`, border: `1px solid ${c}25` }}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-xl" style={{ color: c }}>{v}</span>
                                        <span className="text-[10px] font-mono" style={{ color: `${c}bb` }}>{w}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted leading-snug">{label}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed mt-4">
                            A score of <Chip color="indigo">1.00</Chip> indicates perfect containment.
                            The score and its component values are embedded in the signed CycloneDX ML-BOM.
                        </p>
                    </DocCard>

                    {/* Red team */}
                    <DocCard>
                        <CardTitle icon={GitBranch} color="#EF4444">Security Interrogator (Red-Teaming)</CardTitle>
                        <p className="text-text-muted text-sm leading-relaxed mb-4">
                            A proactive validation phase that subjects the pipeline to attacks that static analysis cannot detect alone:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Prompt Injection',      icon: Terminal,  desc: 'Crafted training inputs attempt to manipulate model outputs at inference time.' },
                                { label: 'Data Poisoning',        icon: Database,  desc: 'Mislabelled and adversarial samples attempt to corrupt model decision boundaries.' },
                                { label: 'Exfiltration Evasion',  icon: Network,   desc: 'Covert channel attempts to bypass NetworkMode: none enforcement.' },
                            ].map(({ label, icon: Icon, desc }) => (
                                <div key={label} className="rounded-xl p-4 bg-surface-hover border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={13} style={{ color: '#EF4444' }} />
                                        <span className="text-xs font-bold text-text-main">{label}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </DocCard>

                    <AlertBox type="success" icon={CheckCircle}>
                        All security metrics are RSA-signed and included in the ML-BOM export.
                        Verify them offline using the bundled <Chip color="green">oubliette_public.pem</Chip>.
                    </AlertBox>
                </Section>

            </div>
        </div>
    );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

function Section({ id, children, innerRef }) {
    return <section id={id} ref={innerRef} className="scroll-mt-6 space-y-6">{children}</section>;
}
// Forward ref wrapper
Section.displayName = 'Section';
const SectionWithRef = ({ id, children, ...props }, ref) => (
    <section id={id} ref={ref} className="scroll-mt-6 space-y-6" {...props}>{children}</section>
);
// Override Section to use forwardRef
const SectionForwarded = ({ id, children, ...props }) => {
    return <section id={id} className="scroll-mt-6 space-y-6" {...props}>{children}</section>;
};

function SectionHeader({ icon: Icon, number, title, color }) {
    return (
        <div className="flex items-start gap-4 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                <Icon size={17} style={{ color }} />
            </div>
            <div>
                <p className="text-[10px] font-bold font-mono uppercase tracking-widest mb-0.5" style={{ color }}>{number}</p>
                <h2 className="text-xl sm:text-2xl font-bold text-text-main">{title}</h2>
            </div>
        </div>
    );
}

function DocCard({ children }) {
    return <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">{children}</div>;
}

function CardTitle({ icon: Icon, color, children }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon size={15} style={{ color }} />
            <h3 className="font-bold text-text-main text-sm">{children}</h3>
        </div>
    );
}

function Chip({ children, color = 'default' }) {
    const styles = {
        default: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
        red:     { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
        green:   { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
        indigo:  { color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)' },
        amber:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
        orange:  { color: '#fb923c', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
    };
    const s = styles[color] || styles.default;
    return (
        <code className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded mx-0.5 inline-block"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                boxShadow: `0 0 6px ${s.color}18` }}>
            {children}
        </code>
    );
}

function AlertBox({ type, icon: Icon, children }) {
    const s = {
        info:    { c: '#60a5fa', bg: 'rgba(59,130,246,0.07)',   b: 'rgba(59,130,246,0.22)' },
        success: { c: '#34d399', bg: 'rgba(16,185,129,0.07)',   b: 'rgba(16,185,129,0.22)' },
        warning: { c: '#fbbf24', bg: 'rgba(245,158,11,0.07)',   b: 'rgba(245,158,11,0.22)' },
    }[type];
    return (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.b}` }}>
            <Icon size={15} style={{ color: s.c, marginTop: 1.5 }} className="shrink-0" />
            <div className="text-sm leading-relaxed" style={{ color: s.c }}>{children}</div>
        </div>
    );
}

function ImagePlaceholder({ icon: Icon, label, description }) {
    return (
        <div className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 py-12 px-6 bg-surface/40 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-border flex items-center justify-center">
                <Icon size={20} className="text-text-muted" />
            </div>
            <div>
                <p className="font-bold text-text-main text-sm">{label}</p>
                <p className="text-text-muted text-xs mt-1 max-w-sm leading-relaxed">{description}</p>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted border border-border px-2 py-1 rounded">
                diagram placeholder
            </span>
        </div>
    );
}

function NavLink({ href, children }) {
    return <a href={href} className="font-semibold text-primary hover:underline underline-offset-2">{children}</a>;
}

function ShellLine({ code }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 bg-black/30 border border-white/5 group">
            <code className="text-xs font-mono text-primary min-w-0 break-all">
                <span className="text-text-muted select-none mr-2">$</span>{code}
            </code>
            <button onClick={copy} className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors">
                {copied ? <CheckCircle size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
            </button>
        </div>
    );
}

function CodeBlock({ code, language = 'bash' }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="rounded-xl overflow-hidden border border-border text-xs">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-hover">
                <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{language}</span>
                <button onClick={copy} className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-main transition-colors px-2 py-0.5 rounded hover:bg-border">
                    {copied ? <CheckCircle size={11} style={{ color: '#10B981' }} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="bg-black/40 p-4 overflow-x-auto">
                <pre className="font-mono text-slate-300 leading-relaxed whitespace-pre text-xs">{code}</pre>
            </div>
        </div>
    );
}
