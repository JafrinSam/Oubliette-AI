import React, { useEffect, useRef, useState } from 'react';
import { Activity, Power } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function StreamVisualizer({ 
  audioRef, 
  isPlaying, 
  barCount = 64
}) {
  // 👇 Destructure 'currentTheme' from the hook
  const { themeName, currentTheme } = useTheme(); 
  
  const canvasRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(true); 
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);

  const colorsRef = useRef({ top: '#f97316', bottom: '#7f1d1d' });

  // ✅ UPDATED EFFECT: Read directly from JS object
  useEffect(() => {
    if (currentTheme) {
      // Direct access - No DOM latency!
      colorsRef.current = { 
        top: currentTheme['--visualizer-top'], 
        bottom: currentTheme['--visualizer-bottom'] 
      };
    }
  }, [currentTheme]); // Run whenever the theme object updates

  // ... (The rest of your code: initAudio, draw, etc. remains exactly the same) ...

  const initAudio = () => {
    if (isInitialized || !audioRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = barCount * 2; 
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination); 

      setIsInitialized(true);
    } catch (e) {
      console.error("Visualizer setup failed:", e);
    }
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !isEnabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLength) - 2; 
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height; 

      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, colorsRef.current.top);    
      gradient.addColorStop(1, colorsRef.current.bottom); 

      ctx.fillStyle = gradient;
      
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      x += barWidth + 2; 
    }

    animationIdRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (isPlaying && isEnabled) {
      if (!isInitialized) initAudio();
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      draw();
    } else {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    }
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [isPlaying, isEnabled, isInitialized]);

  return (
    <div className={`w-full flex flex-col items-center gap-2 transition-all duration-300 ${isEnabled ? 'mb-4' : 'mb-1'}`}>
      {isEnabled && (
        <div className="relative w-full h-32 bg-surface/30 rounded-t-2xl border-x border-t border-border overflow-hidden animate-fade-in-up">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={128} 
              className="w-full h-full object-cover"
            />
        </div>
      )}

      <button 
        onClick={() => setIsEnabled(!isEnabled)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all
          ${isEnabled 
            ? 'bg-surface text-secondary border border-border hover:bg-surface/80 -mt-3 z-10' 
            : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20' 
          }`}
      >
        {isEnabled ? <Power size={12} /> : <Activity size={12} />}
        {isEnabled ? "Hide Visuals" : "Show Visualizer"}
      </button>
    </div>
  );
}