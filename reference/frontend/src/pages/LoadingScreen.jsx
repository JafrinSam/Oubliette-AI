import React from 'react';
// 1. Import your Lottie Wrapper
import LottieAnimation from '../components/utils/LottieAnimation'; 

// 2. Import your JSON files (Make sure names match your saved files)
import musicNoteData from '../assets/animations/music-loading.json'; 
import loadingTextData from '../assets/animations/text-loading.json'; 

export default function LoadingScreen() {
  return (
    // Full screen overlay with high z-index
    <div className="fixed inset-0 z-999999 bg-background flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- Background Atmosphere Effects (Subtle) --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div> 


      {/* --- Central Animation: Music Note --- */}
      <div className="relative z-10 mb-2">
        {/* Container size controls the Lottie size */}
        <div className="w-48 h-48 md:w-64 md:h-64">
            <LottieAnimation 
                animationData={musicNoteData} 
                width="100%" 
                height="100%" 
            />
        </div>
      </div>


      {/* --- Bottom Animation: Loading Text --- */}
      <div className="relative z-10">
         <div className="w-48 h-16 md:w-56 md:h-20">
            <LottieAnimation 
                animationData={loadingTextData} 
                width="100%" 
                height="100%" 
            />
         </div>
      </div>

    </div>
  );
}