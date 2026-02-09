import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk'; // Import the library
import { useNavigate } from 'react-router-dom';
import { Monitor, Calendar, Mic2, Plus, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ModalPortal from '../utils/ModalPortal'; // Reuse your Portal

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme, themeName } = useTheme();

  // Toggle with Ctrl+K
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Helper to run action and close
  const run = (action) => {
    action();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <ModalPortal>
      {/* 1. Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" onClick={() => setOpen(false)} />

      {/* 2. The Command Dialog */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[10001]">
        <Command className="bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-primary">
          
          {/* Input */}
          <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
            <Search className="text-secondary mr-2" size={20} />
            <Command.Input 
              autoFocus
              placeholder="Type a command or search..."
              className="w-full bg-transparent py-4 text-lg outline-none placeholder:text-secondary/50 text-primary"
            />
          </div>

          {/* List Results */}
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
            <Command.Empty className="p-8 text-center text-secondary text-sm">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 px-2">
              <Item icon={<Monitor />} onSelect={() => run(() => navigate('/admin/dashboard'))}>
                Go to Dashboard
              </Item>
              <Item icon={<Calendar />} onSelect={() => run(() => navigate('/admin/schedule'))}>
                Go to Schedule
              </Item>
              <Item icon={<Mic2 />} onSelect={() => run(() => navigate('/admin/rjs'))}>
                Manage RJs
              </Item>
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 px-2 border-t border-white/5 pt-2">
              <Item icon={<Plus />} onSelect={() => run(() => navigate('/admin/shows?create=true'))}>
                Create New Show
              </Item>
              <Item 
                icon={themeName === 'dark' ? <Sun /> : <Moon />} 
                onSelect={() => run(toggleTheme)}
              >
                Toggle Theme
              </Item>
            </Command.Group>

          </Command.List>

          <div className="p-2 border-t border-white/5 text-[10px] text-secondary text-center bg-primary/5">
             Use arrows to navigate, Enter to select
          </div>
        </Command>
      </div>
    </ModalPortal>
  );
}

// Reusable Item Component for cleaner code
function Item({ children, icon, onSelect }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-primary data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
    >
      {/* Icon Wrapper */}
      <span className="text-secondary opacity-70 scale-75">{icon}</span>
      <span className="font-medium text-sm">{children}</span>
    </Command.Item>
  );
}