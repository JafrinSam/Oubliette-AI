import { useState } from 'react';
import {
    Book, Terminal, Shield, UploadCloud, FileCode,
    AlertTriangle, CheckCircle, Copy, ChevronRight,
    Box, Server, WifiOff, Layers, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Docs() {
    return (
        <div className="max-w-5xl mx-auto pb-12 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-text-main flex items-center gap-3">
                    <Book className="text-primary" size={36} /> Documentation
                </h1>
                <p className="text-text-muted text-lg">
                    Comprehensive guide to building and deploying secure training environments in the Oubliette Air-Gapped Infrastructure.
                </p>
            </div>

            {/* Navigation / Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLink icon={Box} title="1. Build Image" desc="Create Docker images outside." href="#step-1" />
                <QuickLink icon={Server} title="2. Export & Transfer" desc="Save to USB/Disk." href="#step-2" />
                <QuickLink icon={UploadCloud} title="3. Ingest" desc="Load into Oubliette." href="#step-3" />
            </div>

            {/* CONTENT SECTIONS */}
            <div className="space-y-12">

                {/* SECTION 1: CONCEPTS */}
                <Section title="The Air-Gap Protocol">
                    <div className="bg-surface/50 border border-border p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 space-y-4">
                            <p className="text-text-muted leading-relaxed">
                                Because Oubliette runs in a strictly isolated environment,
                                <span className="text-error font-bold"> <code>pip install</code> and <code>docker pull</code> will fail</span> inside the platform.
                            </p>
                            <p className="text-text-muted leading-relaxed">
                                You must adopt a <b>"Build Outside, Ship Inside"</b> workflow.
                                Images are built on an internet-connected machine, saved to a single file, physically transferred, and loaded into the secure server.
                            </p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4 shadow-inner">
                            <div className="text-center space-y-2">
                                <WifiOff size={32} className="mx-auto text-text-muted" />
                                <p className="text-xs font-bold text-text-muted">Secure Server</p>
                            </div>
                            <ChevronRight className="text-text-muted/50" />
                            <div className="text-center space-y-2">
                                <Shield size={32} className="mx-auto text-primary" />
                                <p className="text-xs font-bold text-primary">Oubliette AI</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* SECTION 2: BUILD */}
                <Section id="step-1" title="Step 1: Build the Image">
                    <AlertBox type="warning">
                        Perform these steps on a <b>Developer Laptop</b> with Internet Access.
                    </AlertBox>

                    <div className="mt-6 space-y-6">
                        <h3 className="text-lg font-bold text-text-main">Choose Your Base Architecture</h3>

                        {/* STANDARD OPTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CodeCard
                                title="Option A: Deep Learning (GPU)"
                                filename="Dockerfile.deeplearning"
                                code={`# 1. NVIDIA CUDA Base
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
ENV DEBIAN_FRONTEND=noninteractive

# 2. System Deps
RUN apt-get update && apt-get install -y \\
    python3 python3-pip git \\
    && rm -rf /var/lib/apt/lists/*

# 3. Install ML Stack
RUN pip3 install --no-cache-dir \\
    torch torchvision torchaudio \\
    tensorflow transformers \\
    numpy pandas scikit-learn \\
    bandit # <-- REQUIRED

# 4. Security User (Mandatory)
RUN useradd -m -u 1000 trainee
USER trainee`}
                            />

                            <CodeCard
                                title="Option B: Classical ML (CPU)"
                                filename="Dockerfile.sklearn"
                                code={`# 1. Lightweight Python
FROM python:3.10-slim
ENV DEBIAN_FRONTEND=noninteractive

# 2. System Deps
RUN apt-get update && apt-get install -y \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# 3. Install Libraries
RUN pip3 install --no-cache-dir \\
    pandas numpy scikit-learn \\
    joblib matplotlib \\
    bandit # <-- REQUIRED

# 4. Security User (Mandatory)
RUN useradd -m -u 1000 trainee
USER trainee`}
                            />
                        </div>

                        {/* CUSTOM OPTION */}
                        <div className="bg-surface/30 border border-border p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Layers className="text-primary" />
                                <h3 className="text-lg font-bold text-text-main">Option C: Custom / Advanced Environments</h3>
                            </div>
                            <p className="text-text-muted mb-4">
                                Need specialized libraries like <code>spacy</code>, <code>gym</code>, or <code>bio-python</code>?
                                You can build any custom image as long as you follow these <b>3 Golden Rules</b>:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 text-sm text-text-muted">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-success" />
                                        <span>Must have <b>Python 3.8+</b> installed.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-success" />
                                        <span>Must install <code>bandit</code> (pip install bandit).</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-success" />
                                        <span>Must create user <b>trainee</b> (UID 1000).</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-success" />
                                        <span><b>DO NOT</b> copy the wrapper script (Platform injects it).</span>
                                    </div>
                                </div>
                                <CodeCard
                                    title="Dockerfile.custom"
                                    filename="Dockerfile.custom"
                                    code={`FROM python:3.9-slim

# Install YOUR custom libs
RUN pip install spacy gym gymnasium[all]

# --- MANDATORY PLATFORM REQUIREMENTS ---
RUN pip install bandit
RUN useradd -m -u 1000 trainee
USER trainee
# ---------------------------------------`}
                                />
                            </div>
                        </div>

                        <div className="bg-surface rounded-xl border border-border p-5">
                            <p className="text-sm font-bold text-text-muted mb-2">Build Command (Terminal)</p>
                            <CodeBlock code="docker build -t oubliette/trainer:v1 -f Dockerfile.custom ." />
                        </div>
                    </div>
                </Section>

                {/* SECTION 3: EXPORT */}
                <Section id="step-2" title="Step 2: Export to Disk">
                    <p className="text-text-muted mb-4">
                        Save your Docker image as a portable <code>.tar</code> file. This creates a single large file containing all layers.
                    </p>
                    <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
                        <div className="flex items-center gap-2 text-warning text-xs font-bold bg-warning/10 p-2 rounded max-w-fit">
                            <AlertTriangle size={14} />
                            <span>USB Drive Note: Format drive as ExFAT or NTFS (Files &gt; 4GB)</span>
                        </div>
                        <CodeBlock code="docker save -o oubliette_trainer_v1.tar oubliette/trainer:v1" />
                    </div>
                </Section>

                {/* SECTION 4: INGEST */}
                <Section id="step-3" title="Step 3: Ingest into Platform">
                    <AlertBox type="success">
                        Perform these steps inside the <b>Secure Facility</b>.
                    </AlertBox>

                    <ol className="mt-6 space-y-4 list-decimal list-inside text-text-muted">
                        <li className="pl-2">Connect your USB drive to the Secure Server.</li>
                        <li className="pl-2">Navigate to the <b><a href="/runtimes" className="text-primary hover:underline">Runtime Manager</a></b> page in this dashboard.</li>
                        <li className="pl-2">Click <b>"Load Tarball"</b> and select your <code>.tar</code> file.</li>
                        <li className="pl-2">Wait for the upload to complete (this may take 5-10 minutes for large images).</li>
                        <li className="pl-2">Click <b>"Sync with Docker"</b> to register the new environment.</li>
                    </ol>
                </Section>

            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function Section({ id, title, children }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-text-main mb-4 pb-2 border-b border-border">{title}</h2>
            {children}
        </section>
    );
}

function QuickLink({ icon: Icon, title, desc, href }) {
    return (
        <a href={href} className="bg-surface p-4 rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all flex items-center gap-4 group">
            <div className="p-3 bg-surface-hover rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="font-bold text-text-main">{title}</h3>
                <p className="text-xs text-text-muted">{desc}</p>
            </div>
        </a>
    );
}

function CodeCard({ title, filename, code }) {
    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-surface-hover px-4 py-2 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-primary" />
                    <span className="text-xs font-bold text-text-main">{filename}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-text-muted">{title}</span>
            </div>
            <div className="p-4 overflow-x-auto flex-1 bg-[#1A1A1A]">
                <pre className="text-xs font-mono text-gray-300 leading-relaxed">
                    {code}
                </pre>
            </div>
        </div>
    );
}

function CodeBlock({ code }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between border border-white/5 group relative">
            <code className="text-sm font-mono text-primary break-all pr-8">
                <span className="text-gray-500 select-none">$ </span>
                {code}
            </code>
            <button
                onClick={copy}
                className="absolute right-2 top-2 p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-white transition-colors"
                title="Copy Command"
            >
                {copied ? <CheckCircle size={16} className="text-success" /> : <Copy size={16} />}
            </button>
        </div>
    );
}

function AlertBox({ type, children }) {
    const styles = {
        warning: "bg-warning/10 border-warning/20 text-warning",
        success: "bg-success/10 border-success/20 text-success",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    };
    const icons = {
        warning: AlertTriangle,
        success: CheckCircle,
        info: Book
    };
    const Icon = icons[type];

    return (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${styles[type]}`}>
            <Icon size={20} className="shrink-0" />
            <div className="text-sm font-medium">
                {children}
            </div>
        </div>
    );
}
