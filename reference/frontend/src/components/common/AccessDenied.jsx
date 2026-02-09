import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AccessDenied({ 
  title = "Access Restricted", 
  message = "You do not have the required permissions to view this module.",
  showHomeButton = true
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Icon Container with Pulse Effect */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-20"></div>
          <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-xl backdrop-blur-sm">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          {showHomeButton && (
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent-color)] text-white shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Home size={16} />
              Dashboard
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}