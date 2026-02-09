import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MIXER_API = 'http://localhost:3000/api/mixer';
const AUTH_TOKEN = 'YOUR_ADMIN_JWT_TOKEN'; // TODO: Replace with dynamic token from context

function MixerController() {
    const [levels, setLevels] = useState({ music: 1.0, mic: 1.0, master: 1.0 });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const config = {
        headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
        },
    };

    const fetchState = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${MIXER_API}/state`, config);
            setLevels(response.data.state);
            setStatus('Mixer state synced.');
        } catch (error) {
            console.error('Error fetching mixer state:', error);
            setStatus('Error syncing mixer state.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchState();
    }, []);

    const handleVolumeChange = async (type, value) => {
        const newLevel = parseFloat(value).toFixed(2);
        setLevels(prev => ({ ...prev, [type]: parseFloat(newLevel) }));

        try {
            await axios.post(`${MIXER_API}/set-levels`, { [type]: parseFloat(newLevel) }, config);
            setStatus(`Set ${type} volume to ${newLevel}`);
        } catch (error) {
            console.error(`Error setting ${type} volume:`, error);
            setStatus(`Error setting ${type} volume.`);
        }
    };

    const handleFade = async (type) => {
        try {
            const endpoint = type === 'out' ? 'fade-out' : 'fade-in';
            await axios.post(`${MIXER_API}/${endpoint}`, { target: type === 'out' ? 0.2 : 1.0, durationMs: 2000 }, config);
            setStatus(`Fading ${type}...`);
        } catch (error) {
            console.error(`Error fading ${type}:`, error);
            setStatus(`Error fading ${type}.`);
        }
    };

    // Helper component for a single fader block
    const Fader = ({ label, type, currentLevel }) => (
        <div className="flex flex-col mb-6 p-4 border border-gray-700 rounded-xl bg-gray-900 shadow-2xl hover:shadow-gray-700 transition duration-300">
            <label className="text-sm font-semibold text-gray-300 mb-3">
                {label}: <span className="font-mono text-xl text-blue-400">{currentLevel.toFixed(2)}</span>
            </label>
            
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentLevel}
                onChange={(e) => handleVolumeChange(type, e.target.value)}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Buttons for Music Control */}
            {type === 'music' && (
                <div className="flex space-x-4 mt-4">
                    <button 
                        onClick={() => handleFade('out')} 
                        className="flex-1 py-2 px-4 bg-yellow-600 text-gray-900 font-medium rounded-lg hover:bg-yellow-500 transition duration-150 shadow-md"
                    >
                        Fade Out (Talk)
                    </button>
                    <button 
                        onClick={() => handleFade('in')} 
                        className="flex-1 py-2 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 transition duration-150 shadow-md"
                    >
                        Fade In (Full)
                    </button>
                </div>
            )}

            {/* Buttons for Mic Control */}
            {type === 'mic' && (
                <div className="flex space-x-4 mt-4">
                    <button 
                        onClick={() => handleVolumeChange('mic', 0)} 
                        className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-150 shadow-md"
                    >
                        Mute Mic
                    </button>
                    <button 
                        onClick={() => handleVolumeChange('mic', 1.0)} 
                        className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-150 shadow-md"
                    >
                        Unmute Mic
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="border border-gray-700 p-6 my-6 rounded-2xl shadow-inner bg-gray-800">
            <h3 className="text-2xl font-bold mb-4 text-white flex items-center border-b border-gray-700 pb-2">
                🎧 Production Mixer
            </h3>
            <p className={`text-sm ${status.includes('Error') ? 'text-red-400' : 'text-green-400'} mb-6`}>
                {status} {loading && '(Loading...)'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Fader label="Music Volume (Auto DJ)" type="music" currentLevel={levels.music} />
                <Fader label="Mic Volume (Admin Live)" type="mic" currentLevel={levels.mic} />
                <Fader label="Master Output" type="master" currentLevel={levels.master} />
            </div>
        </div>
    );
}

export default MixerController;