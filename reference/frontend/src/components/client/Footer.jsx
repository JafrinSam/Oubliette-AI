import React from 'react';
import { Github, Twitter, Instagram, Linkedin, Mail, ArrowRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface pt-20 pb-10 border-t border-border mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- MAIN GRID SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          
          {/* 1. BRAND COLUMN (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-accent/10 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                <Radio size={24} />
              </div>
              <h3 className="text-2xl font-black text-primary tracking-tight">ByteCast<span className="text-accent">FM</span></h3>
            </Link>
            
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              The official student-run radio station of SRM Trichy. 
              Streaming live music, podcasts, and campus news 24/7 directly to your device.
            </p>

            <div className="flex gap-4">
               <SocialLink href="#" icon={<Twitter size={18} />} />
               <SocialLink href="#" icon={<Instagram size={18} />} />
               <SocialLink href="#" icon={<Linkedin size={18} />} />
               <SocialLink href="#" icon={<Github size={18} />} />
            </div>
          </div>

          {/* 2. SITEMAP COLUMNS (2 cols each) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-primary font-bold tracking-wide text-sm uppercase">Discover</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><FooterLink to="/">Home</FooterLink></li>
              <li><FooterLink to="/live">Live Stream</FooterLink></li>
              <li><FooterLink to="/schedule">Schedule</FooterLink></li>
              <li><FooterLink to="/podcasts">Podcasts</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-primary font-bold tracking-wide text-sm uppercase">Community</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/team">Meet the RJs</FooterLink></li>
              <li><FooterLink to="/apply">Join the Club</FooterLink></li>
              <li><FooterLink to="/contact">Contact</FooterLink></li>
            </ul>
          </div>

          {/* 3. NEWSLETTER COLUMN (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-primary font-bold tracking-wide text-sm uppercase">Stay Tuned</h4>
            <p className="text-secondary text-sm">
              Subscribe to our newsletter for show updates and exclusive campus events.
            </p>
            
            <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" size={16} />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
              <button className="bg-primary text-background p-3 rounded-xl hover:bg-accent hover:text-white transition-all shadow-lg">
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="text-xs text-secondary/60">
              We respect your privacy. Unsubscribe at any time.
            </div>
          </div>

        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-secondary/70">
          
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4">
            <span>&copy; {currentYear} ByteCast FM. All rights reserved.</span>
            <span className="hidden md:inline text-border">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hidden md:inline text-border">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">System Operational</span>
          </div>

        </div>
      </div>
    </footer>
  );
}

// Helper Components for cleaner code
function FooterLink({ to, children }) {
  return (
    <Link to={to} className="block hover:text-accent hover:translate-x-1 transition-all duration-300">
      {children}
    </Link>
  );
}

function SocialLink({ href, icon }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-secondary hover:text-white hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all duration-300 shadow-sm"
    >
      {icon}
    </a>
  );
}