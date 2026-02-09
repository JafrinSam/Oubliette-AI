import { useState, useEffect } from 'react';
import axios from 'axios';

// Replace with your actual AzuraCast URL
// If testing locally, it might be http://localhost/api/nowplaying/1
  const AZURACAST_BASE = "http://localhost"; 
  const STATION_SHORTCODE = "bytecate";      
  const API_URL = `${AZURACAST_BASE}/api/nowplaying/${STATION_SHORTCODE}`;

export function useStationStats() {
  const [stats, setStats] = useState({
    listeners: 0,
    isLive: false,
    currentSong: 'Loading...',
    artist: '',
    coverArt: '',
    streamerName: '',
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(API_URL);
        const data = response.data;

        setStats({
          listeners: data.listeners.total,
          isLive: data.live.is_live,
          // 'streamer_name' usually appears when a DJ is connected
          streamerName: data.live.streamer_name || 'AutoDJ', 
          currentSong: data.now_playing.song.title,
          artist: data.now_playing.song.artist,
          coverArt: data.now_playing.song.art,
          error: null
        });
      } catch (err) {
        console.error("Failed to fetch radio stats:", err);
        setStats(prev => ({ ...prev, error: 'Offline' }));
      }
    };

    // Initial Fetch
    fetchStats();

    // Poll every 10 seconds
    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}