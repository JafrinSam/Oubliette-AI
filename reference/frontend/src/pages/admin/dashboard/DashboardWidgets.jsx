import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] relative overflow-hidden group hover:border-[var(--accent-color)] transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-[var(--text-primary)]">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
        <Icon size={24} />
      </div>
    </div>
    {/* Decorative Background Icon */}
    <Icon className="absolute -bottom-4 -right-4 text-white/5 w-24 h-24 group-hover:scale-110 transition-transform duration-500" />
  </div>
);

export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
    <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
  </div>
);