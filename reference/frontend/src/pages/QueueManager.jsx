import React, { useState, useEffect, useCallback, useRef } from 'react';
import { queueApi } from '../services/queueApi';
import { assetApi } from '../services/assetApi'; 
import toast, { Toaster } from 'react-hot-toast';
import { 
  ListMusic, 
  Play, 
  SkipForward, 
  Plus, 
  RefreshCw, 
  Music2,
  AlertCircle,
  Radio,
  Users,
  Signal
} from 'lucide-react';

const WS_URL = "ws://localhost:5000?role=admin";

export default function QueueManager() {
  // --- State ---
  const [queue, setQueue] = useState([]);
  const [assets, setAssets] = useState([]); 
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // 🔴 Live Data State
  const [nowPlaying, setNowPlaying] = useState(null);
  const [listenerCount, setListenerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef(null);

  // --- 1. WebSocket Connection ---
  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'NOW_PLAYING') {
          setNowPlaying(message.data);
        }
        
        if (message.type === 'LISTENER_COUNT') {
          setListenerCount(message.data?.count || 0); 
        }

      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    ws.current.onclose = () => setIsConnected(false);

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  // --- 2. API Fetching ---
  const fetchQueue = useCallback(async () => {
    try {
      const data = await queueApi.getStatus();
      const rawQueue = data.queue || [];
      
      // 🟢 FILTERING LOGIC 🟢
      // Removes "END", "[]", whitespace, and standard Liquidsoap artifacts
      const cleanQueue = rawQueue.filter(item => {
        const t = item.trim(); // Removes \r, \n, spaces
        return (
          t.length > 0 && 
          t !== "END" && 
          t !== "[]" && 
          !t.includes("No file playing") // Optional extra safety
        );
      });

      setQueue(cleanQueue);
    } catch (err) {
      console.error("Queue fetch error:", err);
    }
  }, []);

  // Wrapper for manual button click to show Toast
  const handleManualRefresh = async () => {
    await fetchQueue();
    toast.success("Queue refreshed");
  };

  const fetchAssets = useCallback(async () => {
    try {
      const data = await assetApi.getAll();
      setAssets(data);
    } catch (err) {
      toast.error("Could not load song library.");
    }
  }, []);

  // Poll every 5 seconds (Silent update, no toast)
  useEffect(() => {
    fetchQueue();
    fetchAssets();
    const interval = setInterval(fetchQueue, 5000); 
    return () => clearInterval(interval);
  }, [fetchQueue, fetchAssets]);

  // --- 3. Handlers ---
  const handleSkip = async () => {
    setSkipping(true);
    try {
      await queueApi.skip();
      toast.success("Skipped! Fading out...");
      setTimeout(fetchQueue, 2000); 
    } catch (err) {
      toast.error("Failed to skip track.");
    } finally {
      setSkipping(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select a song.");

    setLoading(true);
    try {
      await queueApi.add(selectedFile);
      toast.success("Song added to queue!");
      setSelectedFile(""); 
      setTimeout(fetchQueue, 1000);
    } catch (err) {
      toast.error("Failed to add song.");
    } finally {
      setLoading(false);
    }
  };

  const formatQueueItem = (rawString) => {
    const parts = rawString.split('/');
    return parts[parts.length - 1] || rawString;
  };

  return (
    <div className="min-h-full p-8 bg-background text-primary transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-accent flex items-center gap-3">
            <ListMusic size={32} />
            Live Manager
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-secondary">
             <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
             {isConnected ? "System Online" : "Disconnected"}
          </div>
        </div>

        {/* Listeners Badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
            <Users size={20} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-xs text-secondary uppercase font-bold tracking-wider">Listeners</span>
              <span className="text-xl font-mono font-bold leading-none">{listenerCount}</span>
            </div>
          </div>
          
          {/* Manual Refresh Button */}
          <button 
            onClick={handleManualRefresh}
            className="p-2 text-secondary hover:text-accent transition-colors bg-surface border border-border rounded-full hover:bg-background"
            title="Refresh Queue"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COL: Live & Queue --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. ON AIR CARD */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-accent/30 rounded-xl shadow-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Radio size={120} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
               <div className="w-24 h-24 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 shadow-inner">
                  <Signal size={40} className="text-accent animate-pulse" />
               </div>

               <div className="flex-grow text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    On Air
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1 leading-tight break-all">
                    {nowPlaying?.title || "Waiting for track..."}
                  </h2>
                  <p className="text-lg text-gray-300">
                    {nowPlaying?.artist || "Unknown Artist"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-2 uppercase">
                     Source: {nowPlaying?.type || "AutoDJ"}
                  </p>
               </div>

               <div className="flex-shrink-0">
                  <button 
                    onClick={handleSkip}
                    disabled={skipping}
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 transition-all
                      ${skipping 
                        ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed' 
                        : 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 hover:scale-105'
                      }`}
                  >
                    <SkipForward size={28} fill="currentColor" />
                    <span className="text-[10px] font-bold uppercase mt-1">Skip</span>
                  </button>
               </div>
            </div>
          </div>

          {/* 2. QUEUE LIST */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
              <Play size={18} className="text-accent" /> Up Next / Queue
            </h3>
            
            <div className="bg-surface rounded-lg border border-border overflow-hidden min-h-[200px]">
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-secondary">
                  <Music2 size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Queue is empty.</p>
                  <span className="text-xs opacity-50">(Fallback playlist is active)</span>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {queue.map((item, index) => (
                    <li key={index} className="p-3 flex items-center gap-3 hover:bg-background transition-colors group">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-background border border-border text-secondary font-mono text-xs rounded font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-primary break-all">
                          {formatQueueItem(item)}
                        </p>
                        <p className="text-[10px] text-secondary font-mono truncate max-w-[300px] opacity-70">
                          {item}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COL: Add to Queue --- */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-primary">
            <Plus size={20} className="text-accent" />
            Quick Queue
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Library Search
              </label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg p-3 text-primary focus:border-accent outline-none text-sm cursor-pointer"
                size="15" 
              >
                <option value="" disabled className="text-secondary py-1">Select a track...</option>
                {assets.map((asset) => (
                  <option key={asset._id} value={asset.filename} className="py-1 px-1 hover:bg-accent/10 rounded">
                    {asset.title || asset.filename}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedFile}
              className="w-full flex justify-center items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
              {loading ? 'Adding...' : 'Add Track'}
            </button>
            
            <div className="p-3 bg-surface border border-border rounded-lg flex gap-3 text-xs text-secondary mt-4">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-accent" />
              <p>
                Requests added here are processed after Scheduled Events but before AutoDJ.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}