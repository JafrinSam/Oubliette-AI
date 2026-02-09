import React from "react";
import { Play, Pause, Users, Music, Volume1, Volume2, FastForward } from 'lucide-react';
import ElasticSlider from "../utils/ElasticSlider"; 
import { usePlayer } from "../../context/PlayerContext"; 

export default function RadioHero() {
  const { 
    metaData, isPlaying, togglePlay, setVolume, volume,
    seekToLive, seekToTime, bufferState 
  } = usePlayer();

// Calculate Delay
  // We clamp it so visually it never claims to be more than 60s behind
  // even if the audio is paused for an hour.
  const rawSecondsBehind = bufferState.end - bufferState.current;
  const secondsBehind = Math.min(rawSecondsBehind, 60); 
  
  const isBehind = rawSecondsBehind > 10; // Still trigger "Behind" state if > 10s

  return (
    <div className="relative w-full bg-surface text-primary pt-32 pb-48 overflow-hidden transition-colors duration-300 rounded-b-[3rem] shadow-2xl z-10">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
        
        {/* Left: Album Art */}
        <div className="flex-shrink-0 relative group">
           {/* LIVE TAG / JUMP BUTTON */}
           {isBehind ? (
                <button 
                    onClick={seekToLive}
                    className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md bg-red-500 text-white shadow-lg animate-pulse hover:bg-red-600 transition-all flex items-center gap-2"
                >
                    <FastForward size={12} fill="currentColor"/> JUMP TO LIVE
                </button>
           ) : (
                <div className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border ${metaData.isLive ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black/40 border-white/20 text-white'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${metaData.isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
                    {metaData.isLive ? "Live" : "On Air"}
                </div>
           )}

          <div className="w-72 h-72 md:w-96 md:h-96 rounded-[2rem] bg-black border border-white/10 shadow-2xl overflow-hidden relative">
             <img src={metaData.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745"} alt="Album Art" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>

        {/* Right: Info & Controls */}
        <div className="flex-1 text-center md:text-left w-full">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-4 text-primary line-clamp-2">{metaData.title}</h1>
          <p className="text-2xl md:text-3xl text-secondary font-medium mb-10 tracking-wide">{metaData.artist}</p>

          {/* MAIN CONTROLS ROW */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
             <button onClick={togglePlay} className="w-20 h-20 bg-primary text-background rounded-full flex items-center justify-center hover:scale-105 hover:bg-accent hover:text-white transition-all duration-300 shadow-xl border-4 border-surface cursor-pointer">
               {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
             </button>

             {/* Volume Slider */}
             <div className="w-full max-w-sm">
                 <ElasticSlider 
                    leftIcon={<Volume1 size={20}/>} 
                    rightIcon={<Volume2 size={20}/>} 
                    // FIX: Pass the Current Value here
                    value={volume * 100} 
                    // FIX: startingValue acts as Minimum value (0), not current value
                    startingValue={0} 
                    maxValue={100} 
                    onChange={(v) => setVolume(v/100)} 
                 />
             </div>
          </div>

          {/* SCRUBBER ROW (Only if behind or buffered) */}
          {bufferState.end > 0 && (
            <div className="w-full max-w-lg bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-xs font-bold text-secondary mb-2">
                    <span>REPLAY BUFFER</span>
                    <span className={!isBehind ? 'text-red-500' : ''}>{!isBehind ? 'LIVE' : `-${Math.floor(secondsBehind)}s BEHIND`}</span>
                </div>
                <input 
                    type="range" 
                    min={bufferState.start} 
                    max={bufferState.end} 
                    step="0.1"
                    value={bufferState.current || bufferState.start} 
                    onChange={(e) => seekToTime(Number(e.target.value))}
                    className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}