import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    // Add a new toast to the queue
    const addToast = useCallback((type, title, message, duration = 5000) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, title, message }]);

        // Auto-dismiss
        if (duration) {
            setTimeout(() => removeToast(id), duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // Helper functions for easy usage
    const toast = {
        success: (title, msg) => addToast('success', title, msg),
        error: (title, msg) => addToast('error', title, msg),
        warning: (title, msg) => addToast('warning', title, msg),
        info: (title, msg) => addToast('info', title, msg),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* --- TOAST CONTAINER (Fixed Overlay) --- */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

// --- INDIVIDUAL TOAST COMPONENT ---
function ToastItem({ type, title, message, onClose }) {
    // Theme Configuration based on Type
    const themes = {
        success: { icon: CheckCircle, color: 'text-emerald-500', border: 'border-l-emerald-500', bg: 'bg-emerald-500/5' },
        error: { icon: AlertOctagon, color: 'text-red-500', border: 'border-l-red-500', bg: 'bg-red-500/5' },
        warning: { icon: AlertTriangle, color: 'text-amber-500', border: 'border-l-amber-500', bg: 'bg-amber-500/5' },
        info: { icon: Info, color: 'text-blue-500', border: 'border-l-blue-500', bg: 'bg-blue-500/5' },
    };

    const theme = themes[type] || themes.info;
    const Icon = theme.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border border-border
                bg-surface/95 ${theme.border} border-l-4 ${theme.bg}
            `}
        >
            <div className={`mt-0.5 ${theme.color}`}>
                <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold ${theme.color} mb-0.5`}>{title}</h4>
                {message && <p className="text-xs text-text-muted leading-relaxed">{message}</p>}
            </div>

            <button
                onClick={onClose}
                className="text-text-muted hover:text-text-main transition-colors p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}

// Custom Hook for using the toast
export function useToast() {
    return useContext(ToastContext);
}
