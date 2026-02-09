import React from 'react';
import { useLocation } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Users, RotateCcw, FastForward } from 'lucide-react'; 
import GlassSurface from '../utils/GlassSurface'; 
import { useTheme } from '../../context/ThemeContext';
import { usePlayer } from '../../context/PlayerContext';

export default function GlobalPlayer() {
  const { themeName } = useTheme();
  const location = useLocation();
  const isLivePage = location.pathname === '/live';

  const { 
    hasStarted, 
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    isMuted, 
    audioRef, 
    STREAM_URL,
    metaData,
    seekToLive,
    seekToTime,
    bufferState // { current, start, end }
  } = usePlayer();

// Calculate Delay
  // We clamp it so visually it never claims to be more than 60s behind
  // even if the audio is paused for an hour.
  const rawSecondsBehind = bufferState.end - bufferState.current;
  const secondsBehind = Math.min(rawSecondsBehind, 60); 
  
  const isBehind = rawSecondsBehind > 10; // Still trigger "Behind" state if > 10s
  // Helper for Slider
  const handleSeek = (e) => {
      seekToTime(Number(e.target.value));
  };

  return (
    <>
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

      {hasStarted && !isLivePage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl transition-all duration-500 animate-in slide-in-from-bottom-20 fade-in">
          
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={50}
            borderWidth={0}
            backgroundOpacity={themeName === 'light' ? 0.95 : 0.9} // Increased opacity for complex UI
            blur={30}
            isStepped={false}
            isDark={themeName === 'dark'}
            className="shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10"
          >
            <div className="flex flex-col w-full">
                
                {/* --- TOP ROW: Main Controls --- */}
                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-3 w-full">
                
                    {/* LEFT: INFO */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
                            <img src={metaData.albumArt} alt="Art" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <h4 className="text-primary font-bold text-sm md:text-base truncate">{metaData.title}</h4>
                            <p className="text-secondary text-xs md:text-sm truncate">{metaData.artist}</p>
                        </div>
                    </div>

                    {/* CENTER: PLAY/PAUSE */}
                    <div className="flex items-center gap-4 md:gap-6 mx-4">
                        <button onClick={togglePlay} className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>

                    {/* RIGHT: VOLUME */}
                    <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
                         {/* JUMP TO LIVE BUTTON (Desktop) */}
                        {isBehind && (
                             <button 
                                onClick={seekToLive}
                                className="flex items-center gap-1 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg animate-pulse hover:bg-red-600 transition-colors mr-2"
                             >
                                <FastForward size={10} fill="currentColor" /> JUMP TO LIVE
                            </button>
                        )}

                        <div className="flex items-center gap-1 text-xs font-bold text-secondary/60">
                            <Users size={12} /> {metaData.liveListeners}
                        </div>
                        <div className="flex items-center gap-2 group">
                            {isMuted || volume === 0 ? <VolumeX size={20} className="text-secondary"/> : <Volume2 size={20} className="text-secondary"/>}
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={isMuted ? 0 : volume} 
                                onChange={(e) => setVolume(parseFloat(e.target.value))} 
                                className="w-20 h-1 bg-secondary/30 rounded-lg cursor-pointer" 
                            />
                        </div>
                    </div>
                </div>

                {/* --- BOTTOM ROW: SCRUBBER (Only shows if buffer exists) --- */}
                {bufferState.end > 0 && (
                    <div className="px-6 pb-3 pt-0 flex items-center gap-3">
                        {/* Live/Delay Indicator */}
                        <span className={`text-[10px] font-bold uppercase w-12 text-right ${!isBehind ? 'text-red-500' : 'text-secondary'}`}>
                            {!isBehind ? 'LIVE' : `-${Math.floor(secondsBehind)}s`}
                        </span>

                        {/* SCRUBBER SLIDER */}
                        <div className="relative flex-1 h-1.5 group/slider">
                             {/* Background Track */}
                             <div className="absolute inset-0 bg-secondary/20 rounded-full"></div>
                             
                             {/* Buffered Area (Not really needed for live but good context) */}
                             
                             {/* Play Progress */}
                             {/* Note: In a live buffer, we map range [start, end] to [0%, 100%] */}
                             <input 
                                type="range" 
                                min={bufferState.start} 
                                max={bufferState.end} 
                                step="0.1"
                                value={bufferState.current || bufferState.start} 
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                             />
                             
                             {/* Visual Progress Bar */}
                             <div 
                                className="absolute top-0 left-0 h-full bg-accent rounded-full pointer-events-none transition-all duration-100"
                                style={{ 
                                    width: `${((bufferState.current - bufferState.start) / (bufferState.end - bufferState.start)) * 100}%` 
                                }}
                             ></div>
                             
                             {/* Thumb (Only visible on hover) */}
                             <div 
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none"
                                style={{ 
                                    left: `${((bufferState.current - bufferState.start) / (bufferState.end - bufferState.start)) * 100}%` 
                                }}
                             ></div>
                        </div>

                        {/* Total Buffer Time (Optional context) */}
                        <span className="text-[10px] text-secondary/50 font-mono">
                           -{Math.floor((bufferState.end - bufferState.start) / 60)}m Buffer
                        </span>
                    </div>
                )}
            </div>
          </GlassSurface>
        </div>
      )}
    </>
  );
}