import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, ArrowRight, Search, X, 
  ExternalLink, Filter, Tag 
} from 'lucide-react';
import { eventApi } from '../services/eventApi'; 
import { getStrapiImage } from '../utils/strapi';

// --- SKELETONS ---
const EventCardSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden h-[24rem] relative animate-pulse">
    <div className="absolute inset-0 bg-surface/50" />
    <div className="absolute top-6 left-6 right-6 flex justify-between">
       <div className="w-16 h-16 bg-white/5 rounded-2xl"></div>
       <div className="w-24 h-8 bg-white/5 rounded-full"></div>
    </div>
    <div className="absolute bottom-4 left-4 right-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
       <div className="h-6 w-3/4 bg-white/10 rounded-md mb-4"></div>
       <div className="flex justify-between items-center">
          <div className="h-4 w-1/3 bg-white/10 rounded-md"></div>
          <div className="h-8 w-8 bg-white/10 rounded-full"></div>
       </div>
    </div>
  </div>
);

// --- MODAL COMPONENT ---
const EventModal = ({ event, isOpen, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image state when event changes
  useEffect(() => {
    setImageLoaded(false);
  }, [event]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-surface border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-2/5 h-56 md:h-auto relative bg-surface">
          {!imageLoaded && (
             <div className="absolute inset-0 flex items-center justify-center bg-surface animate-pulse z-0">
                 <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
             </div>
          )}
          <img 
            src={event.image} 
            alt={event.title} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar bg-background/95 backdrop-blur-xl">
          
          <div className="flex items-center gap-3 mb-4">
             <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {event.category}
             </span>
             {event.status && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                    event.status.toLowerCase() === 'open' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {event.status}
                </span>
             )}
          </div>

          <h2 className="text-3xl font-black text-primary mb-6 leading-tight">
            {event.title}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <InfoItem icon={<Calendar size={18}/>} label="Date" value={event.fullDate} />
             <InfoItem icon={<Clock size={18}/>} label="Time" value={event.time} />
             <InfoItem icon={<MapPin size={18}/>} label="Location" value={event.location} />
             <InfoItem icon={<Tag size={18}/>} label="Type" value={event.category} />
          </div>

          <div className="prose prose-invert max-w-none text-secondary mb-10 text-sm md:text-base leading-relaxed">
            <h4 className="text-primary font-bold mb-2">Event Details</h4>
            <div className="whitespace-pre-wrap">{event.description}</div>
          </div>

          <div className="pt-6 border-t border-border/50">
             {event.registrationLink ? (
                 <a 
                    href={event.registrationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-primary text-background py-4 rounded-xl font-bold hover:bg-accent hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
                 >
                    Register Now <ExternalLink size={18} />
                 </a>
             ) : (
                 <button disabled className="w-full bg-surface border border-border text-secondary py-4 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    Registration Closed
                 </button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/50">
        <div className="text-accent mt-0.5">{icon}</div>
        <div>
            <span className="block text-[10px] uppercase font-bold text-secondary/60">{label}</span>
            <span className="block text-sm font-semibold text-primary">{value || "TBA"}</span>
        </div>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function EventsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Filtering States
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await eventApi.getAll();
        
        // Transform API data safely
        const formatted = res.data.map(item => {
            const d = new Date(item.date);
            
            // Handle Rich Text or String description
            let desc = "No description available.";
            if (Array.isArray(item.description)) {
                desc = item.description.map(block => block.children.map(child => child.text).join(" ")).join("\n");
            } else if (typeof item.description === 'string') {
                desc = item.description;
            }

            return {
                id: item.documentId,
                title: item.title,
                dateObj: d, 
                // Pre-process date parts to avoid .split() errors later
                date: d.getDate(), 
                month: d.toLocaleString('default', { month: 'short' }),
                fullDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                
                time: item.time ? item.time.slice(0, 5) : "TBA",
                category: item.Category || "General",
                image: getStrapiImage(item.tumbnail), 
                description: desc,
                location: item.location,
                status: item.registration_status,
                registrationLink: item.registration_link
            };
        })
        .filter(e => e.dateObj >= new Date().setHours(0,0,0,0)) // Filter past events
        .sort((a, b) => a.dateObj - b.dateObj); // Sort nearest first

        setEvents(formatted);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --- FILTER LOGIC ---
  const filteredEvents = events.filter(event => {
      const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Tech', 'Cultural', 'Academic'];

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-20">
      
      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-3 block">ByteCast Calendar</span>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Upcoming Events</h1>
        <p className="text-secondary max-w-lg mx-auto text-lg leading-relaxed">
            Don't miss out on workshops, hackathons, and cultural fests happening at SRM Trichy.
        </p>
      </div>

      {/* CONTROLS BAR */}
      <div className="max-w-7xl mx-auto px-6 mb-12 sticky top-24 z-30">
        <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                            activeCategory === cat 
                            ? 'bg-primary text-background border-primary shadow-lg scale-105' 
                            : 'bg-transparent text-secondary border-transparent hover:bg-white/5 hover:text-primary'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            
            {/* Search Input */}
            <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Find an event..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-6 py-3 rounded-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none w-full md:w-72 transition-all text-sm shadow-inner"
                />
            </div>
        </div>
      </div>

      {/* EVENTS GRID */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => <EventCardSkeleton key={i} />)}
            </div>
        ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                    <div 
                        key={event.id} 
                        onClick={() => setSelectedEvent(event)}
                        className="group relative h-[24rem] rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 cursor-pointer hover:-translate-y-2 bg-card active:scale-[0.98]"
                    >
                        
                        {/* Background Image */}
                        <div className="absolute inset-0">
                           <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                           />
                           {/* Gradient Overlay */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                            {/* Date Badge */}
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center min-w-[70px] text-white shadow-lg">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">{event.month}</span>
                                <span className="block text-2xl font-black leading-none mt-1">{event.date}</span>
                            </div>
                            
                            {/* Category Tag */}
                            <span className="px-4 py-1.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent/20 border border-white/10">
                                {event.category}
                            </span>
                        </div>

                        {/* Bottom Content (Glass Card) */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-white transition-all duration-300 group-hover:bg-white/20">
                            <h4 className="text-xl font-bold mb-2 leading-tight line-clamp-2">{event.title}</h4>
                            
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-white/70 flex items-center gap-2 font-medium">
                                  <Clock size={14} /> {event.time}
                                </p>
                                
                                {/* Responsive Arrow Button */}
                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-all duration-300 
                                    opacity-100 translate-x-0 
                                    md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0"
                                >
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                     </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                <Filter size={64} className="mb-4 text-secondary" />
                <h3 className="text-2xl font-bold text-primary">No events found</h3>
                <p className="text-secondary">Try adjusting your search or category filter.</p>
            </div>
        )}
      </div>

      {/* MODAL POPUP */}
      <EventModal 
        isOpen={!!selectedEvent} 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />

    </div>
  );
}