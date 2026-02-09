import React, { useEffect, useState, useRef } from 'react';
import { 
  Radio, Mic2, Users, Cpu, Globe, Signal, Headphones, 
  Code, Palette, Zap, ArrowRight, Github, Linkedin, Calendar, 
  Server, Database, GraduationCap, Stethoscope, Palette as ArtIcon, Utensils 
} from 'lucide-react';

// --- MOCK DATA ---
const TIMELINE = [
  { year: "2021", title: "The Frequency Begins", desc: "A small group of audio enthusiasts pitch the idea of a campus radio to the management." },
  { year: "2022", title: "Studio Setup", desc: "The first soundproof booth is constructed in the Main Block. Beta testing starts on LAN." },
  { year: "2023", title: "Official Launch", desc: "ByteCast FM goes live on the internet. 'Morning Coffee' becomes the first hit show." },
  { year: "2024", title: "24/7 Automation", desc: "Implemented AzuraCast for non-stop streaming and expanded the team to 50+ members." },
];

// NEW: Colleges Data
const CAMPUS_COLLEGES = [
  { 
    name: "College of Engg. & Tech", 
    short: "SRM IST", 
    type: "Technology", 
    icon: <Cpu size={24} />,
    image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=600&auto=format&fit=crop",
    desc: "Hub of innovation, coding clubs, and the main ByteCast studio."
  },
  { 
    name: "Medical College & Research", 
    short: "SRM Medical", 
    type: "Healthcare", 
    icon: <Stethoscope size={24} />,
    image: "https://images.unsplash.com/photo-1587351021759-3e566b92f243?q=80&w=600&auto=format&fit=crop",
    desc: "Home to future doctors and our health awareness podcast series."
  },
  { 
    name: "College of Arts & Science", 
    short: "SRM Arts", 
    type: "Humanities", 
    icon: <ArtIcon size={24} />,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
    desc: "The creative soul of the campus, bringing drama and literature to air."
  },
  { 
    name: "Institute of Hotel Mgmt", 
    short: "SRM IHM", 
    type: "Hospitality", 
    icon: <Utensils size={24} />,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600&auto=format&fit=crop",
    desc: "Masters of culinary arts and regular contributors to our food shows."
  },
  { 
    name: "College of Nursing", 
    short: "SRM Nursing", 
    type: "Healthcare", 
    icon: <Users size={24} />,
    image: "https://images.unsplash.com/photo-1576091160550-217358c7db81?q=80&w=600&auto=format&fit=crop",
    desc: "Dedicated to care, compassion, and community service initiatives."
  },
  { 
    name: "Allied Health Sciences", 
    short: "SRM AHS", 
    type: "Research", 
    icon: <Globe size={24} />,
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop",
    desc: "Bridging technology and medicine for a better tomorrow."
  }
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1621360841012-98565251d2f8?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop", 
];

const TEAM_RJS = [
  { name: "Sarah J.", role: "Morning Show Host", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200", social: "@sarahspeak" },
  { name: "Arjun K.", role: "Tech Talk RJ", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200", social: "@arjun_tech" },
  { name: "Maya S.", role: "Cultural Beat", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200", social: "@maya_vibe" },
  { name: "Rohit V.", role: "Late Night Lo-Fi", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200", social: "@rohit_lofi" },
];

const TEAM_DEV = [
  { name: "NoxMetis", role: "Lead Full Stack", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", icon: <Code size={16}/> },
  { name: "David R.", role: "Frontend Architect", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", icon: <Palette size={16}/> },
  { name: "Ananya B.", role: "Backend Engineer", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200", icon: <Zap size={16}/> },
];

const TEAM_CORE = [
  { name: "Dr. S. Kumar", role: "Faculty Advisor", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" },
  { name: "Priya M.", role: "Station Manager", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200" },
  { name: "Vikram S.", role: "Head of Operations", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200" },
];

// --- CUSTOM STYLES ---
const customStyles = `
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
  @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-scroll { animation: scroll 20s linear infinite; }
`;

export default function AboutView() {
  return (
    <div className="min-h-screen bg-background text-primary font-sans transition-colors duration-300 overflow-x-hidden selection:bg-accent selection:text-white">
      <style>{customStyles}</style>

      {/* --- 1. HERO SECTION --- */}
      <section className="relative overflow-hidden py-32 px-6 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <div className="mb-8 p-6 bg-surface/50 backdrop-blur-md rounded-full shadow-2xl border border-white/10 inline-flex items-center justify-center relative group hover:scale-110 transition-transform duration-500 animate-float">
            <Radio size={64} className="text-accent relative z-10" />
          </div>
          
          <FadeIn>
            <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tight mb-6 leading-tight">
              The Voice of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-orange-400 to-red-500">SRM Trichy</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p className="text-xl md:text-2xl text-secondary font-light max-w-3xl mx-auto leading-relaxed mb-10">
               <span className="font-bold text-primary">ByteCast FM</span> connects engineering, arts, and culture. 
               Streaming live 24/7 from the heart of the Irungalur campus.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* --- 2. CAMPUS NETWORK (NEW SECTION) --- */}
      <section className="py-24 bg-surface/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
            <SectionHeader title="One Campus, Many Voices" subtitle="Connecting every corner of the SRM Trichy ecosystem." icon={<GraduationCap size={20}/>} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CAMPUS_COLLEGES.map((college, idx) => (
                    <FadeIn key={idx} delay={idx * 100}>
                        <div className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer bg-card border border-white/5 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500">
                            {/* Background Image */}
                            <img src={college.image} alt={college.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-[0.4] group-hover:brightness-[0.3]" />
                            
                            {/* Overlay Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-accent border border-white/10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    <ArrowRight size={18} />
                                </div>

                                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="p-1.5 rounded-lg bg-accent/20 text-accent backdrop-blur-sm">
                                            {college.icon}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">{college.type}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{college.name}</h3>
                                    <p className="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                                        {college.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </div>
      </section>

      {/* --- 3. OUR STORY TIMELINE --- */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
           <SectionHeader title="Our Journey" subtitle="From a hostel room idea to a fully-fledged station." icon={<Calendar size={20}/>} />
           
           <div className="relative border-l-2 border-border ml-3 md:ml-6 space-y-12">
              {TIMELINE.map((item, idx) => (
                  <FadeIn key={idx} delay={idx * 150} className="relative pl-8 md:pl-12">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-4 border-accent shadow-[0_0_10px_rgba(255,100,0,0.5)]"></div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
                          <span className="text-2xl font-black text-accent">{item.year}</span>
                          <h3 className="text-xl font-bold text-primary">{item.title}</h3>
                      </div>
                      <p className="text-secondary leading-relaxed max-w-lg">{item.desc}</p>
                  </FadeIn>
              ))}
           </div>
        </div>
      </section>

      {/* --- 4. TEAM: RJs --- */}
      <section className="py-24 bg-surface/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="Meet the Voices" subtitle="The personalities behind the microphone." icon={<Mic2 size={20}/>} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {TEAM_RJS.map((member, idx) => (
                <FadeIn key={idx} delay={idx * 100}><ProfileCard member={member} type="rj" /></FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. STUDIO GALLERY --- */}
      <section className="py-24 bg-background relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <SectionHeader title="Studio Life" subtitle="Where the magic happens." icon={<Signal size={20}/>} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[500px] md:h-[400px]">
                {GALLERY_IMAGES.map((src, i) => (
                    <FadeIn key={i} delay={i * 100} className={`relative overflow-hidden rounded-3xl group ${i === 1 ? 'md:col-span-2' : ''} h-full`}>
                        <img src={src} alt="Studio" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale hover:grayscale-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                            <span className="text-white font-bold tracking-widest uppercase text-sm">BTS &bull; Studio {i+1}</span>
                        </div>
                    </FadeIn>
                ))}
            </div>
         </div>
      </section>

      {/* --- 6. TEAM: DEVELOPERS --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <SectionHeader title="The Builders" subtitle="Engineering the digital experience." icon={<Code size={20}/>} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TEAM_DEV.map((member, idx) => (
                <FadeIn key={idx} delay={idx * 150}><DevCard member={member} /></FadeIn>
            ))}
        </div>
      </section>

      {/* --- 7. TECH STACK (SCROLLING MARQUEE) --- */}
      <section className="py-12 bg-surface/50 overflow-hidden border-y border-white/5">
         <div className="max-w-7xl mx-auto px-6 mb-8 text-center"><span className="text-xs font-bold text-secondary uppercase tracking-[0.3em]">Powered By Modern Tech</span></div>
         <div className="relative flex overflow-x-hidden group">
            <div className="animate-scroll flex gap-12 whitespace-nowrap opacity-50 hover:opacity-100 transition-opacity duration-500">
               {[1,2].map((iter) => (
                   <React.Fragment key={iter}>
                       <TechItem name="React" icon={<Code size={24}/>} />
                       <TechItem name="MongoDB" icon={<Database size={24}/>} />
                       <TechItem name="AzuraCast" icon={<Radio size={24}/>} />
                       <TechItem name="Docker" icon={<Server size={24}/>} />
                       <TechItem name="Tailwind" icon={<Palette size={24}/>} />
                       <TechItem name="Node.js" icon={<Cpu size={24}/>} />
                       <TechItem name="Icecast" icon={<Signal size={24}/>} />
                   </React.Fragment>
               ))}
            </div>
         </div>
      </section>

      {/* --- 8. TEAM: CORE --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
          <SectionHeader title="Leadership" subtitle="The visionaries guiding the station." icon={<Users size={20}/>} />
          <div className="flex flex-wrap justify-center gap-10">
             {TEAM_CORE.map((member, idx) => (
                <FadeIn key={idx} delay={idx * 100}><ProfileCard member={member} type="core" /></FadeIn>
             ))}
          </div>
      </section>

      {/* --- 10. CTA --- */}
      <section className="py-32 px-6 text-center">
        <FadeIn>
            <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tight">
                Join the Frequency.
            </h2>
            <p className="text-secondary text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                We are always hiring RJs, Sound Engineers, and Developers. No experience needed, just passion.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 bg-primary text-background font-bold rounded-full shadow-xl hover:bg-accent hover:text-white hover:scale-105 transition-all duration-300 flex items-center gap-3">
                    <Mic2 size={20} /> Apply Now
                </button>
                <button className="px-8 py-4 border border-border text-primary font-bold rounded-full hover:bg-surface transition-all duration-300 flex items-center gap-3">
                    Contact Us <ArrowRight size={20} />
                </button>
            </div>
            </div>
        </FadeIn>
      </section>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function TechItem({ name, icon }) {
    return (
        <div className="flex items-center gap-3 text-2xl font-black text-primary/30 mx-8">
            {icon} {name}
        </div>
    );
}

function FadeIn({ children, delay = 0, className = "" }) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => setIsVisible(entry.isIntersecting)));
        if (domRef.current) observer.observe(domRef.current);
        return () => { if (domRef.current) observer.disconnect(); }
    }, []);

    return (
        <div ref={domRef} className={`${className} transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

function SectionHeader({ title, subtitle, icon }) {
    return (
        <FadeIn className="mb-16 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-3">{icon} {title}</div>
            <h2 className="text-4xl md:text-5xl font-serif text-primary mb-2">{title}</h2>
            <p className="text-secondary text-lg">{subtitle}</p>
        </FadeIn>
    );
}

function FeatureCard({ icon, title, desc, highlight }) {
    return (
        <div className={`p-8 rounded-[2rem] border transition-all duration-500 group h-full hover:-translate-y-2 flex flex-col relative overflow-hidden ${highlight ? 'bg-surface border-accent/20 shadow-2xl shadow-accent/5' : 'bg-card border-border/50 hover:border-accent/30 hover:bg-surface'}`}>
            <div className="mb-6 p-4 bg-background rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner border border-white/5 relative z-10">{icon}</div>
            <h3 className="text-2xl font-bold mb-3 text-primary tracking-wide relative z-10">{title}</h3>
            <p className="text-secondary leading-relaxed text-sm md:text-base relative z-10">{desc}</p>
        </div>
    );
}

function ProfileCard({ member, type }) {
    return (
        <div className="group flex flex-col items-center text-center">
            <div className="relative mb-4 w-32 h-32 md:w-40 md:h-40 perspective-1000">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent to-blue-500 blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface shadow-xl relative transition-transform duration-700 group-hover:rotate-[360deg] group-hover:scale-105">
                     <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                </div>
                {type === 'rj' && <div className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full border-4 border-surface shadow-sm z-10 group-hover:animate-bounce"><Mic2 size={14} /></div>}
            </div>
            <h4 className="text-xl font-bold text-primary mb-1 group-hover:text-accent transition-colors">{member.name}</h4>
            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">{member.role}</span>
        </div>
    );
}

function DevCard({ member }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/40 border border-white/5 hover:bg-surface hover:border-accent/50 transition-all duration-300 group hover:shadow-lg hover:shadow-accent/5">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0"><img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" /></div>
            <div className="flex-1 min-w-0"><h4 className="text-lg font-bold text-primary truncate group-hover:text-accent transition-colors">{member.name}</h4><div className="flex items-center gap-2 text-secondary text-sm">{member.icon}<span>{member.role}</span></div></div>
             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <button className="p-2 hover:text-accent transition-colors"><Github size={16} /></button>
            </div>
        </div>
    );
}