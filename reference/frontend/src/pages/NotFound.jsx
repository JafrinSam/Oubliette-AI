import React from 'react';
import { Radio, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
// 1. Import your Lottie Wrapper
import LottieAnimation from '../components/utils/LottieAnimation'; 
// 2. Import your JSON file
import errorRobotData from '../assets/animations/404-robot.json'; 

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 relative overflow-hidden text-primary">
      
      {/* Background Decor: Faint Radar Ripple */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[600px] h-[600px] border border-secondary rounded-full animate-ping [animation-duration:3s]" />
        <div className="absolute w-[400px] h-[400px] border border-secondary rounded-full animate-ping [animation-duration:3s] [animation-delay:0.5s]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center">
        
        {/* --- LOTTIE ANIMATION --- */}
        {/* Replaced the old Icon and H1 with this Animation */}
        <div className="w-full max-w-[400px] h-auto mb-2">
            <LottieAnimation 
                animationData={errorRobotData} 
                width="100%" 
                height="auto" 
            />
        </div>

        <h2 className="text-4xl font-serif font-bold text-accent mb-4">
          Signal Lost
        </h2>

        <p className="text-xl text-secondary mb-10 max-w-md mx-auto leading-relaxed">
          We scanned all frequencies, but the page you are looking for is static. It might have been moved or never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/" 
            className="group px-8 py-4 bg-primary text-background rounded-full font-bold text-lg hover:bg-accent hover:text-white transition-all shadow-lg flex items-center gap-3"
          >
            <Radio size={20} className="group-hover:animate-pulse" />
            <span>Return to Live Feed</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-surface text-secondary border border-white/10 rounded-full font-bold text-lg hover:text-primary hover:border-white/30 transition-all flex items-center gap-3"
          >
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>
        </div>

      </div>

      {/* Footer Frequency Scale Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex justify-between items-end px-4 opacity-20 pointer-events-none">
         {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-1 bg-primary rounded-t-full ${i % 5 === 0 ? 'h-8' : 'h-4'}`} />
         ))}
      </div>
    </div>
  );
}