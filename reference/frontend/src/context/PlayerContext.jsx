import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // NEW: Track Buffer Timeline for Slider
  const [bufferState, setBufferState] = useState({
    current: 0,      // Current playback position (seconds)
    start: 0,        // Start of buffered audio (seconds)
    end: 0,          // End of buffered audio (The "Live" edge)
    duration: 0      // Total seconds available in buffer
  });

  // Metadata State
  const [metaData, setMetaData] = useState({
    title: "ByteCast FM",
    artist: "SRM Trichy",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300",
    liveListeners: 0,
    isLive: false,
    streamerName: "AutoDJ"
  });

  const audioRef = useRef(null);
  
  // --- CONFIGURATION ---
  const AZURACAST_BASE = "http://localhost"; 
  const STATION_SHORTCODE = "bytecate";      
  const API_URL = `${AZURACAST_BASE}/api/nowplaying/${STATION_SHORTCODE}`;
  const STREAM_URL = `${AZURACAST_BASE}/listen/${STATION_SHORTCODE}/radio.mp3`;

  // --- VOLUME SYNC ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // --- FETCH METADATA ---
  const fetchNowPlaying = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const fixArt = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300";
        return path.startsWith("http") ? path : `${AZURACAST_BASE}${path}`;
      };

      setMetaData({
        title: data.now_playing?.song?.title || "Unknown Track",
        artist: data.now_playing?.song?.artist || "ByteCast FM",
        albumArt: fixArt(data.now_playing?.song?.art),
        liveListeners: data.listeners?.total || 0, 
        isLive: data.live?.is_live || false,
        streamerName: data.live?.streamer_name || "AutoDJ"
      });
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  useEffect(() => {
    fetchNowPlaying(); 
    const interval = setInterval(fetchNowPlaying, 10000); 
    return () => clearInterval(interval);
  }, []);


  // --- BUFFER TRACKING LOOP ---
  useEffect(() => {
    if (!hasStarted || !audioRef.current) return;

    const updateBuffer = () => {
        const audio = audioRef.current;
        if (audio && audio.buffered.length > 0) {
            const current = audio.currentTime;
            const count = audio.buffered.length;
            const end = audio.buffered.end(count - 1); // Live Edge
            
            // True start of browser buffer
            const actualStart = audio.buffered.start(0); 
            
            // LOGIC: Create a 60-second Sliding Window
            // If the buffer is larger than 60s, the "Window Start" moves forward.
            // Math.max ensures we don't go before the actual start (in the first few seconds of listening)
            const windowStart = Math.max(actualStart, end - 60);

            setBufferState({
                current: current,
                start: windowStart, // Use the Window Start, not Actual Start
                end: end,
                duration: end - windowStart
            });
        }
    };

    const interval = setInterval(updateBuffer, 500); // Update UI 2x per second
    return () => clearInterval(interval);
  }, [hasStarted]);


  // --- AUDIO CONTROLS ---

  const seekToLive = () => {
    if (audioRef.current) {
        // Option A: Reload source (Safest for long pauses)
        // audioRef.current.load();
        
        // Option B: Jump to end of buffer (Best for "DVR" feel)
        if (audioRef.current.buffered.length > 0) {
            const liveEdge = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
            audioRef.current.currentTime = liveEdge - 0.5; // -0.5s safety buffer
        }
        
        audioRef.current.play();
        setIsPlaying(true);
    }
  };

  const seekToTime = (time) => {
        if (audioRef.current) {
            // Validation: Ensure we don't seek before our 60s window
            const validStart = Math.max(audioRef.current.buffered.start(0), bufferState.end - 60);
            
            if (time < validStart) {
                audioRef.current.currentTime = validStart;
            } else {
                audioRef.current.currentTime = time;
            }
        }
    };

  const playMusic = () => {
    if (audioRef.current) {
      if (!hasStarted) {
        // First load
        setHasStarted(true);
        audioRef.current.load();
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(err => console.error("Playback Error:", err));
      }
    }
  };

  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) pauseMusic();
    else playMusic();
  };

  return (
    <PlayerContext.Provider value={{
      isPlaying,
      hasStarted,
      playMusic,
      pauseMusic,
      togglePlay,
      seekToLive,  
      seekToTime,  // NEW
      bufferState, // NEW { current, start, end }
      volume,
      setVolume,
      isMuted,
      setIsMuted,
      audioRef,
      STREAM_URL,
      metaData 
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);