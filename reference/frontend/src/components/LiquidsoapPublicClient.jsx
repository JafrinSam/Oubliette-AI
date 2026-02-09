import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Users, 
  Music, 
  Mic2, 
  Activity, 
  Volume2, 
  AlertCircle 
} from 'lucide-react';
import StreamVisualizer from "../components/StreamVisualizer"; // Ensure path is correct

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000?role=client";
const STREAM_BASE = import.meta.env.VITE_STREAM_URL || "http://localhost:8000/radio.mp3";

// 2. Append the timestamp dynamically to bypass browser cache
const STREAM_URL = `${STREAM_BASE}?t=${Date.now()}`;
export default function LiquidsoapPublicClient() {
  const [track, setTrack] = useState({
    title: "Waiting for stream...",
    artist: "Station Offline",
    type: "Offline",
    art: null
  });

  const [listenerCount, setListenerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("✅ Connected to Radio WebSocket");
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NOW_PLAYING') {
            setTrack(message.data || { title: "Station Idle", artist: "", type: "Offline" });
          }
          if (message.type === 'LISTENER_COUNT') {
            setListenerCount(message.data.count);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.current.onclose = () => {
        console.log("❌ Disconnected from Radio WebSocket");
        setIsConnected(false);
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-surface rounded-full mb-6 shadow-lg">
            <Radio size={48} className="text-accent" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl md:text-6xl font-magilio text-primary tracking-wide mb-4">
          BlazeUp <span className="text-accent">Live</span>
        </h1>
        <p className="text-lg text-secondary max-w-lg mx-auto">
          Streaming the best beats directly to your browser via Liquidsoap & Icecast.
        </p>
      </header>

      {/* DISCONNECT BANNER */}
      {!isConnected && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 flex items-center justify-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">Live Updates Disconnected (Reconnecting...)</span>
        </div>
      )}

      {/* MAIN PLAYER CARD */}
      <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative group">
        
        {/* Subtle Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

        <div className="p-8 md:p-12 flex flex-col items-center">
            
            {/* Live Indicator */}
            <div className="mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border transition-colors duration-300 ${
                    track.type !== "Offline"
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                }`}>
                    <span className={`h-2 w-2 rounded-full ${track.type !== "Offline" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
                    {track.type !== "Offline" ? "ON AIR" : "OFF AIR"}
                </span>
            </div>

            {/* Song Info */}
            <div className="text-center mb-8 space-y-3">
                <h2 className="text-2xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3">
                    {track.type === 'Prerecorded Show' ? (
                       <Mic2 size={28} className="text-accent hidden md:block" />
                    ) : (
                       <Music size={28} className="text-accent hidden md:block" />
                    )}
                    {track.title}
                </h2>
                
                <p className="text-xl text-secondary font-medium flex items-center justify-center gap-2">
                    <span className="opacity-70">by</span>
                    <span className="text-accent/90">{track.artist || "Unknown Artist"}</span>
                </p>
                {track.album && track.album !== "Unknown Album" && (
                  <p className="text-sm text-secondary/60 italic">{track.album}</p>
                )}
            </div>

            {/* 1. MOVED VISUALIZER HERE (Above Player) 
            */}
            <div className="w-full max-w-md">
                <StreamVisualizer 
                    audioRef={audioRef} 
                    isPlaying={isPlaying} 
                    barCount={32} 
                />
            </div>

            {/* 2. AUDIO PLAYER (Bottom)
            */}
            <div className="w-full max-w-md bg-surface p-4 rounded-b-2xl rounded-t-md shadow-inner border border-border z-10">
              <audio
                  ref={audioRef}  
                  controls
                  src={STREAM_URL}
                  crossOrigin="anonymous" // <--- This MUST match the headers above
                  preload="auto"
                  className="w-full h-10 accent-accent"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  // Add this to handle stream errors gracefully
                  onError={(e) => console.error("Audio Error:", e.target.error)}
              >
                  Your browser does not support the audio element.
              </audio>
            </div>
            
            <p className="text-xs text-secondary mt-4 flex items-center gap-1 opacity-70">
                <Volume2 size={12} />
                High Quality MP3 Stream
            </p>
        </div>

        {/* Footer Stats */}
        <div className="bg-surface border-t border-border p-4 md:px-12 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-primary font-medium transition-all duration-300">
                <Users size={18} className="text-accent" />
                <span>{listenerCount} Listening Now</span>
            </div>
            <div className="flex items-center gap-2 text-secondary">
                <Activity size={18} className={isPlaying ? "text-green-500 animate-pulse" : "text-gray-500"} />
                <span>Status: {isConnected ? "Live Data" : "Connecting..."}</span>
            </div>
        </div>
      </div>
    </div>
  );
}