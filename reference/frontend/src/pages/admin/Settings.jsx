import React, { useState, useEffect } from 'react';
import { User, Lock, Palette, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../services/apiClient';

// Import Modular Components
import ProfileSettings from '../../components/admin/settings/ProfileSettings';
import SecuritySettings from '../../components/admin/settings/SecuritySettings';
import AppearanceSettings from '../../components/admin/settings/AppearanceSettings';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({ name: '', email: '', avatar: '' });
  const [loading, setLoading] = useState(true);

  // Load User Data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/users/me'); 
        setUser(res.data.data);
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your account preferences and workspace.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <nav className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                    ${isActive 
                      ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20 scale-[1.02]' 
                      : 'hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-h-[600px]">
            <div className={`
                border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden
                bg-[var(--bg-card)] backdrop-blur-xl transition-colors duration-300
            `}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)] z-10">
                  <Loader2 className="animate-spin text-[var(--accent-color)]" size={32} />
                </div>
              ) : (
                <>
                  {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
                  {activeTab === 'security' && <SecuritySettings />}
                  {activeTab === 'appearance' && <AppearanceSettings />}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}