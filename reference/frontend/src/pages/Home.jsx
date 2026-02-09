import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Calendar, Mic2, ArrowRight, Radio, Cpu, Activity, ChevronDown, 
  User, Music, Send, Instagram, Linkedin, Headphones, Star, Zap
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import LottieAnimation from '../components/utils/LottieAnimation';

// 1. Import Services & Utils
import { eventApi } from '../services/eventApi'; 
import { getStrapiImage } from '../utils/strapi'; // Ensure this path is correct

// 2. Import Lottie JSONs
import studioAnimation from '../assets/animations/radio-studio.json';
import musicNoteAnimation from '../assets/animations/music-loading.json';

// --- DATA: FM STATION EVENTS (Static) ---
const STATION_EVENTS = [
  { 
    id: 1, 
    title: "Indie Artist Spotlight", 
    desc: "Exclusive interview with 'The Local Train' band members live in studio.",
    time: "Tomorrow, 6 PM",
    image: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=800&auto=format&fit=crop"
  },
  { 
    id: 2, 
    title: "Horror Story Night", 
    desc: "RJ Mike narrates the spookiest hostel stories submitted by students.",
    time: "Friday, 11 PM",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=800&auto=format&fit=crop"
  }
];

const RJS = [
  { id: 1, name: "RJ Sarah", show: "Morning Coffee", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "RJ Arjun", show: "Tech Talk", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "RJ Priya", show: "Late Night Lo-Fi", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" },
  { id: 4, name: "RJ Mike", show: "Campus Sports", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
];

export default function Home() {
  const { playMusic } = usePlayer();
  
  // State for Campus Events
  const [campusEvents, setCampusEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch Events from Strapi
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventApi.getAll();
        
        const formattedEvents = data.data.map(item => {
           const dateObj = new Date(item.date);
           const month = dateObj.toLocaleString('default', { month: 'short' });
           const day = dateObj.getDate();
           
           let formattedTime = item.time;
           if (item.time) {
              const [hours, minutes] = item.time.split(':');
              const timeDate = new Date();
              timeDate.setHours(hours);
              timeDate.setMinutes(minutes);
              formattedTime = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
           }

           const imageUrl = getStrapiImage(item.tumbnail); 

           return {
             id: item.documentId, 
             title: item.title,
             date: `${month} ${day}`,
             time: formattedTime,
             category: item.Category,
             image: imageUrl 
           };
        });

        setCampusEvents(formattedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white transition-colors duration-300 pb-32">

      <main>
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop" 
              alt="SRM Studio Background" 
              className="w-full h-full object-cover opacity-60 dark:opacity-40 scale-105 animate-slow-zoom transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent dark:from-background dark:via-background/95 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/50 to-transparent transition-colors duration-300" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid md:grid-cols-12 gap-12 items-center pt-20">
            
            {/* Left Content */}
            <div className="md:col-span-7 space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold tracking-widest uppercase text-[10px] backdrop-blur-sm dark:backdrop-blur-md transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Live from Irungalur Campus
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight">
                The Voice of <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">
                  SRM Trichy
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-secondary max-w-xl leading-relaxed">
                Welcome to <span className="text-primary font-bold">ByteCast FM</span>. 
                Bridging technology, culture, and campus life. 
                Streaming 24/7 for the students, by the students.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={playMusic}
                  className="group relative px-8 py-4 bg-accent text-white font-bold rounded-full overflow-hidden shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all transform hover:-translate-y-1 cursor-pointer"
                >
                  <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12 origin-left" />
                  <span className="relative flex items-center gap-3">
                    <Play size={20} fill="currentColor" /> Start Listening
                  </span>
                </button>
                
                <Link to="/schedule" className="px-8 py-4 bg-surface/70 dark:bg-surface/50 backdrop-blur-sm dark:backdrop-blur-md border border-border/30 dark:border-white/10 text-primary font-bold rounded-full hover:bg-surface transition-all duration-300 flex items-center gap-2">
                  Show Schedule <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Right Content: LOTTIE ANIMATION */}
            <div className="hidden md:block md:col-span-5 relative perspective-1000">
              <div className="absolute top-10 -right-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-pulse"></div>
              
              <div className="relative transform rotate-y-12 transition-transform hover:rotate-0 duration-500">
                <div className="bg-card/60 dark:bg-card/30 backdrop-blur-lg dark:backdrop-blur-2xl border border-border/30 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl transition-all duration-300 min-h-[400px] flex flex-col justify-center items-center">
                    
                    <div className="w-full h-64 mb-4">
                        <LottieAnimation 
                           animationData={studioAnimation} 
                           width="100%" 
                           height="100%" 
                        />
                    </div>

                    <div className="text-center">
                        <span className="text-xs font-bold text-accent tracking-widest uppercase mb-1 block">Now Live</span>
                        <h3 className="text-2xl font-bold text-primary">ByteCast Studio</h3>
                        <p className="text-secondary text-sm mt-2">Connecting Campus Minds</p>
                    </div>

                </div>
              </div>
            </div>

          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20 opacity-70">
            <div className="flex flex-col items-center gap-2 text-secondary">
               <span className="text-[10px] uppercase tracking-widest font-bold">Explore</span>
               <ChevronDown size={24} />
            </div>
          </div>
        </section>


        {/* ================= 2. UPCOMING FM EVENTS ================= */}
        <section className="py-20 bg-background border-b border-border/50 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-8">
                    <Zap className="text-accent" size={28} />
                    <h2 className="text-3xl font-bold text-primary">Station Specials</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {STATION_EVENTS.map(event => (
                        <div key={event.id} className="group relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-lg cursor-pointer">
                            <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <span className="inline-block bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                                    Broadcast Event
                                </span>
                                <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.desc}</p>
                                
                                <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest">
                                    <Radio size={14} /> {event.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>


{/* ================= 3. UPCOMING CAMPUS EVENTS (ENHANCED UI) ================= */}
        <section className="py-24 bg-surface border-y border-border/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <Activity size={16} /> Campus Pulse
                </h2>
                <h3 className="text-4xl md:text-5xl font-black text-primary tracking-tight">Upcoming at SRM</h3>
              </div>
              <Link to="/events" className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-background transition-all font-medium group">
                View Full Calendar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* 3. Render Loading State or Data */}
               {loadingEvents ? (
                   // Skeleton Loading
                   [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-card h-[22rem] rounded-[2rem] animate-pulse border border-border p-6 flex flex-col justify-end gap-4">
                         <div className="w-3/4 h-8 bg-surface rounded-lg"></div>
                         <div className="w-1/2 h-4 bg-surface rounded"></div>
                      </div>
                   ))
               ) : (
                   // Real Events from Strapi
                   campusEvents.map(event => (
                     <div key={event.id} className="group relative h-[24rem] rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 cursor-pointer hover:-translate-y-2">
                        
                        {/* --- BACKGROUND IMAGE --- */}
                        <div className="absolute inset-0">
                           <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                           />
                           {/* Gradient Overlay for Text Readability */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                        </div>

                        {/* --- TOP BADGES --- */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                            {/* Date Badge */}
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center min-w-[70px] text-white shadow-lg">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">{event.date.split(' ')[0]}</span>
                                <span className="block text-2xl font-black leading-none mt-1">{event.date.split(' ')[1]}</span>
                            </div>
                            
                            {/* Category Tag */}
                            <span className="px-4 py-1.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent/20 border border-white/10">
                                {event.category}
                            </span>
                        </div>

                        {/* --- BOTTOM CONTENT (Glass Card) --- */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-white transition-all duration-300 group-hover:bg-white/20">
                            <h4 className="text-xl font-bold mb-2 leading-tight line-clamp-2">{event.title}</h4>
                            
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-white/70 flex items-center gap-2 font-medium">
                                  <ClockIcon /> {event.time}
                                </p>
                                
                                {/* Hover Action Button */}
                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>

                     </div>
                   ))
               )}
               
               {/* Callout Card (Always present) */}
                <div className="relative h-[24rem] rounded-[2.5rem] overflow-hidden flex flex-col justify-end p-8 text-white group shadow-2xl hover:shadow-orange-500/20 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-purple-700 z-0"></div>
                    <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-700 z-0" alt="Audience" />
                    
                    <div className="relative z-10 mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-white border border-white/10">
                            <Mic2 size={24} />
                        </div>
                        <h4 className="text-3xl font-black mb-3 leading-tight">Your Voice <br/> Matters.</h4>
                        <p className="text-white/80 mb-8 text-sm leading-relaxed max-w-[200px]">Join the ByteCast team as an RJ, Sound Engineer, or Content Creator.</p>
                        
                        <Link to="/about" className="inline-flex w-full items-center justify-center gap-2 bg-white text-orange-600 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg">
                           Join the Club <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
          </div>
        </section>
        
        {/* ... Rest of sections (Features, RJs, Interactive, Recruitment) ... */}
         <section className="py-24 bg-background transition-colors duration-300">
            {/* ... Features Section Content ... */}
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
              <div className="relative order-2 md:order-1">
                 <div className="absolute top-8 left-8 w-full h-full border-2 border-accent/20 rounded-[2rem] -z-10"></div>
                 <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop" alt="Students" className="rounded-[2rem] shadow-2xl z-10 w-full grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
                 <div className="absolute -bottom-8 -right-8 bg-card p-6 rounded-2xl shadow-xl border border-border/50 dark:border-white/5 z-20 flex items-center gap-5 animate-float transition-colors duration-300">
                    <div className="bg-gradient-to-br from-accent to-orange-500 p-4 rounded-full text-white shadow-lg"><Mic2 size={24} /></div>
                    <div><p className="text-xs text-secondary font-bold uppercase tracking-wider">Community</p><p className="text-2xl font-black text-primary">100% Student Run</p></div>
                 </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">Not Just Radio.<br/><span className="text-accent">It's a Movement.</span></h2>
                <p className="text-secondary text-lg leading-relaxed mb-10">ByteCast FM is the official student-run radio station of <strong>SRM IST Trichy</strong>.</p>
                <div className="space-y-6">
                   <FeatureItem icon={<Radio size={20} />} title="24/7 Music & Podcasts" desc="From Lo-Fi study beats to high-energy exam motivators." />
                   <FeatureItem icon={<Cpu size={20} />} title="Tech & Innovation" desc="Weekly spotlights on student projects and hackathon winners." />
                   <FeatureItem icon={<Activity size={20} />} title="Campus Updates" desc="Real-time announcements for exams, fests, and holidays." />
                </div>
              </div>
            </div>
         </section>

         <section className="py-24 bg-surface border-t border-border/50 dark:border-white/5">
             <div className="max-w-7xl mx-auto px-6">
                 <div className="text-center mb-16"><span className="text-accent font-bold tracking-[0.2em] uppercase text-sm">The Voices</span><h2 className="text-4xl font-bold text-primary mt-2">Meet Your RJs</h2></div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     {RJS.map((rj) => (
                         <div key={rj.id} className="group text-center">
                             <div className="relative w-40 h-40 mx-auto rounded-full p-1 border-2 border-dashed border-accent/30 group-hover:border-accent transition-colors duration-500 mb-6">
                                 <div className="w-full h-full rounded-full overflow-hidden relative"><img src={rj.image} alt={rj.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                             </div>
                             <h3 className="text-xl font-bold text-primary">{rj.name}</h3><p className="text-sm text-secondary font-medium mt-1">{rj.show}</p>
                         </div>
                     ))}
                 </div>
             </div>
         </section>

         <section className="py-24 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background to-surface opacity-50 z-0" />
             <div className="max-w-4xl mx-auto px-6 relative z-10">
                 <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                     <div className="text-center mb-10">
                        <div className="w-20 h-20 mx-auto mb-2"><LottieAnimation animationData={musicNoteAnimation} width="100%" height="100%" /></div>
                        <h2 className="text-3xl font-bold text-primary">Request a Show</h2>
                     </div>
                     <form className="space-y-4 max-w-md mx-auto">
                         <div className="flex gap-2"><input type="text" placeholder="Show Name" className="w-full px-6 py-4 bg-background/50 border border-border rounded-full" /><button className="bg-accent text-white px-6 rounded-full"><Send size={18} /></button></div>
                     </form>
                 </div>
             </div>
         </section>
         

      </main>

    </div>
  );
}

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex items-start gap-5 p-4 rounded-2xl hover:bg-surface border border-transparent hover:border-border/50 dark:hover:border-white/5 transition-all duration-300 group">
     <div className="mt-1 p-3 rounded-xl bg-surface group-hover:bg-accent group-hover:text-white text-accent transition-colors shadow-sm duration-300">{icon}</div>
     <div><h4 className="font-bold text-primary text-lg mb-1">{title}</h4><p className="text-secondary text-sm leading-relaxed">{desc}</p></div>
  </div>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)