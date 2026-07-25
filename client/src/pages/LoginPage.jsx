import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Shield, Fingerprint, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Terminal lines for the right panel
    const terminalLines = [
        { text: '> Initializing Zero-Trust Execution Engine...', delay: '0s' },
        { text: '> Loading Prisma ORM schema... [OK]', delay: '0.5s' },
        { text: '> Verifying AST Firewall signatures... [ACTIVE]', delay: '1s' },
        { text: '> Docker CapDrop: ALL enforced... [OK]', delay: '1.5s' },
        { text: '> Network Air-Gap micro-segmentation... [VERIFIED]', delay: '2s' },
        { text: '> CycloneDX ML-BOM generator... [READY]', delay: '2.5s' },
        { text: '> ZT_res Score Engine initialized... [ONLINE]', delay: '3s' },
        { text: '> Awaiting operator authentication...', delay: '3.5s' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel — Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-[0_0_60px_rgba(255,107,53,0.06)] p-8 relative overflow-hidden">
                    {/* Glowing top accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400"></div>

                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                            O
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-main tracking-tight">
                                Oubliette<span className="text-primary">-AI</span>
                            </h2>
                        </div>
                    </div>
                    <p className="text-text-muted text-sm font-mono mb-8">Zero-Trust Execution Gateway</p>

                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-center gap-2 bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 mb-6 text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-text-main text-sm font-medium mb-1.5">Identity (Email)</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-sm placeholder:text-text-muted"
                                placeholder="operator@enterprise.local"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-text-main text-sm font-medium mb-1.5">Cryptographic Passphrase</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-text-main focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-sm placeholder:text-text-muted"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary/25 transition-all flex justify-center items-center gap-2 disabled:opacity-60"
                        >
                            <Lock size={16} />
                            {isLoading ? 'Authenticating...' : 'Establish Secure Session'}
                        </button>
                    </form>

                    {/* Security Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-border">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            <Shield size={10} />
                            AES-256 Encrypted
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                            <Lock size={10} />
                            Strict RBAC
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                            <Fingerprint size={10} />
                            Session Monitored
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Panel — Security Telemetry */}
            <div className="hidden lg:flex w-1/2 bg-surface border-l border-border items-center justify-center relative overflow-hidden">
                {/* Faint grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                />

                <div className="relative z-10 max-w-lg px-12">
                    <div className="bg-background/50 border border-border rounded-2xl p-6 font-mono backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                            <div className="w-3 h-3 rounded-full bg-error"></div>
                            <div className="w-3 h-3 rounded-full bg-warning"></div>
                            <div className="w-3 h-3 rounded-full bg-success"></div>
                            <span className="text-text-muted text-xs ml-2">oubliette-security-daemon</span>
                        </div>

                        <div className="space-y-2.5 text-sm">
                            {terminalLines.map((line, i) => (
                                <p key={i}
                                    className="text-success opacity-0 animate-fade-in"
                                    style={{ animationDelay: line.delay, animationFillMode: 'forwards' }}
                                >
                                    {line.text}
                                </p>
                            ))}
                            <p className="text-primary animate-pulse mt-4">▌</p>
                        </div>
                    </div>

                    {/* ZT Badges */}
                    <div className="flex gap-3 mt-6 justify-center">
                        <div className="text-center bg-background/50 border border-border rounded-xl px-4 py-3 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-primary font-mono">1.00</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">ZT_res Score</p>
                        </div>
                        <div className="text-center bg-background/50 border border-border rounded-xl px-4 py-3 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-success font-mono">NIST</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">800-207 Compliant</p>
                        </div>
                        <div className="text-center bg-background/50 border border-border rounded-xl px-4 py-3 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-warning font-mono">AST</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Firewall Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
