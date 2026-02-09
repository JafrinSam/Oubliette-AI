import React from 'react';
import { Link } from 'react-router-dom';
import RadioHero from '../components/client/RadioHero';
import ScheduleWidget from '../components/client/ScheduleWidget'; // Import the new widget
import { Mic2, Headphones, Newspaper, ArrowRight } from 'lucide-react';

export default function Live() {
  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
      
      <main>
        {/* 1. Main Player Section */}
        <RadioHero />
        
        {/* 2. Floating Schedule Section (Updated Logic) */}
        <ScheduleWidget />
        
        {/* 3. Recruitment / Club Section */}
        <section className="py-32 bg-background relative overflow-hidden">
          {/* ... existing recruitment section code ... */}
          <div className="absolute top-20 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              
              {/* Text Content */}
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-primary leading-tight">
                  Your Voice. <br />
                  <span className="text-accent">On Air.</span>
                </h2>
                <p className="text-xl text-secondary mb-8 leading-relaxed">
                  Join the <span className="text-primary font-bold">ByteCast FM</span> team at SRM Trichy. 
                  We are looking for passionate students to take over the mic, curate playlists, and engineer live sessions.
                </p>
                
                <div className="grid gap-6 mb-10">
                  <FeatureItem icon={<Mic2 />} title="Radio Jockeys" desc="Host your own weekly show and interview guests." />
                  <FeatureItem icon={<Headphones />} title="Sound Engineers" desc="Manage the live broadcasting tech and audio mixing." />
                  <FeatureItem icon={<Newspaper />} title="Content Creators" desc="Script shows, manage social media, and write blogs." />
                </div>

                <Link 
                  to="/about" 
                  className="inline-flex items-center gap-3 bg-primary text-background px-10 py-4 rounded-full font-bold text-lg hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1 shadow-xl"
                >
                  Apply for the Club <ArrowRight size={20} />
                </Link>
              </div>

              {/* Visual / Image Placeholder */}
              <div className="relative">
                <div className="aspect-square rounded-[3rem] bg-surface border border-border/50 dark:border-white/10 overflow-hidden relative shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 group">
                   <img 
                      src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop" 
                      alt="SRM Studio Mic"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                      <div className="absolute bottom-8 left-8">
                        <span className="text-accent font-bold tracking-widest uppercase text-xs">SRM Trichy</span>
                        <div className="text-white font-black text-5xl">STUDIO <br/> ONE</div>
                      </div>
                   </div>
                </div>
                
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
              </div>

            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface/50 transition-colors duration-300">
      <div className="p-3 bg-surface rounded-xl text-accent border border-border/50 dark:border-white/10 shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg text-primary">{title}</h3>
        <p className="text-secondary text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}