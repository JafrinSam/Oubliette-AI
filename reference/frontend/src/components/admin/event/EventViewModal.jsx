import React from 'react';
import { 
  X, Calendar, MapPin, Mail, Phone, Clock, User, Shield, 
  Link as LinkIcon, Users, Star, ExternalLink 
} from 'lucide-react';
import ModalPortal from '../../utils/ModalPortal';
import RichTextDisplay from '../../common/RichTextDisplay';

// Helper for Status Colors
const getStatusColor = (status) => {
  const colors = {
    'Open': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    'Closed': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    'Filling Fast': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    'Waitlist': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    'Coming Soon': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
};

export default function EventViewModal({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  // --- Helper: Date & Time Formatting Logic ---
  const startDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  
  const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();
  
  const formatDate = (date) => 
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const dateString = isMultiDay 
    ? `${formatDate(startDate)} - ${formatDate(endDate)}` 
    : formatDate(startDate);

  const timeString = event.endTime 
    ? `${event.time} - ${event.endTime}` 
    : event.time;

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose} 
      >
        <div 
          className="bg-[var(--bg-card)] w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()} 
        >
          
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-2xl">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                  {event.category}
                </span>
                {/* ⭐ Featured Badge */}
                {event.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20">
                    <Star size={10} fill="currentColor" /> Featured
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-[var(--text-primary)]">
                {event.title}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-0 flex-1 custom-scrollbar">
             
             {/* 🖼️ IMAGE SECTION */}
             {event.thumbnail && !event.thumbnail.includes('default') && (
                <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)] group">
                    {/* Blurred Background Layer */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 dark:opacity-30 scale-110" 
                        style={{ backgroundImage: `url(${event.thumbnail})` }} 
                    />
                    {/* Main Image */}
                    <img 
                      src={event.thumbnail} 
                      alt={event.title} 
                      className="relative w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-[1.01]"
                    />
                </div>
             )}

             <div className="p-6 space-y-8">
                
                {/* 📊 KEY DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* 1. Date Block */}
                    <div className="p-4 rounded-xl flex items-start gap-3.5 bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-xs uppercase opacity-70 mb-0.5">Date & Time</p>
                            <p className="font-semibold text-sm">{dateString}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-xs opacity-90">
                                <Clock size={12} /> <span>{timeString}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Location Block */}
                    <div className="p-4 rounded-xl flex items-start gap-3.5 bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-xs uppercase opacity-70 mb-0.5">Location</p>
                            <p className="font-semibold text-sm">{event.location}</p>
                        </div>
                    </div>

                    {/* 3. Registration Block (New) */}
                    <div className="p-4 rounded-xl flex items-start gap-3.5 bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 md:col-span-2 lg:col-span-1">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                            <Users size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xs uppercase opacity-70 mb-1">Availability</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(event.registrationStatus)}`}>
                                    {event.registrationStatus}
                                </span>
                                <span className="text-xs font-medium opacity-80">
                                    {event.capacity > 0 ? `${event.capacity} Seats` : 'Unlimited'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔗 REGISTRATION LINK BUTTON */}
                {event.registrationLink && (
                    <div className="flex justify-center md:justify-start">
                        <a 
                            href={event.registrationLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-color)] text-white font-bold rounded-xl shadow-lg shadow-[var(--accent-color)]/20 hover:brightness-110 transition-all active:scale-95"
                        >
                            Register Now <ExternalLink size={18} />
                        </a>
                    </div>
                )}

                <hr className="border-[var(--border-color)]" />

                {/* Description */}
                <div>
                    <h3 className="font-bold text-lg mb-3 pb-2 border-b border-[var(--border-color)] text-[var(--text-primary)]">
                        About Event
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed">
                        <RichTextDisplay content={event.description} />
                    </div>
                </div>

                {/* Organizers */}
                {event.organizers && event.organizers.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Organizers</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {event.organizers.map((org, i) => (
                            <div key={i} className="flex flex-col p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] hover:border-[var(--accent-color)] transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[var(--text-primary)]">{org.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-[var(--accent-color)] font-medium">
                                            <Shield size={10} /> {org.role}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5 mt-auto pt-3 border-t border-[var(--border-color)]">
                                    {org.email && (
                                        <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate">
                                        <Mail size={12}/> {org.email}
                                        </a>
                                    )}
                                    {org.phone && (
                                        <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        <Phone size={12}/> {org.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}
             </div>

             {/* Meta Info Footer */}
             <div className="px-6 py-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex justify-between text-xs text-[var(--text-secondary)] font-medium">
                <p>Posted by: <span className="text-[var(--text-primary)]">{event.createdBy?.name || 'Admin'}</span></p>
                <p>Last Updated: {new Date(event.updatedAt).toLocaleDateString()}</p>
             </div>

          </div>
        </div>
      </div>
    </ModalPortal>
  );
}