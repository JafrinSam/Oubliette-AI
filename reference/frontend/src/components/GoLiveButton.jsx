import React, { useState } from 'react';
import axios from 'axios';

// --- Configuration ---
const BACKEND_API_URL = 'http://localhost:3000/api/live/publish-config'; 
const AUTH_TOKEN = 'YOUR_ADMIN_JWT_TOKEN'; // TODO: Replace with dynamic token from context

function GoLiveButton() {
    const [isLive, setIsLive] = useState(false);
    const [status, setStatus] = useState('Ready to go live');
    const [peerConnection, setPeerConnection] = useState(null);

    // --- Core WebRTC Logic ---

    const startPublishing = async (streamUrl, srsApiUrl) => {
        try {
            setStatus('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStatus('Initializing WebRTC connection...');
            
            const pc = new RTCPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            setPeerConnection(pc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            setStatus('Sending SDP Offer to SRS for authentication...');
            
            const response = await axios.post(srsApiUrl, {
                api: srsApiUrl,
                streamurl: streamUrl,
                sdp: pc.localDescription.sdp,
            });

            // SRS has called the Node.js /api/srs/on-publish hook here!
            const answerSdp = response.data.sdp;
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
            
            pc.onconnectionstatechange = () => {
                console.log('WebRTC State:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setIsLive(true);
                    setStatus('🔴 LIVE: Your audio is now streaming.');
                } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    handleStop();
                }
            };
            
        } catch (error) {
            console.error('WebRTC Publishing Error:', error);
            setStatus(`Failed: ${error.message}. Check console.`);
            handleStop();
        }
    };

    // --- Main Workflow Handler ---

    const handleGoLive = async () => {
        if (isLive) {
            handleStop();
            return;
        }

        try {
            setStatus('Requesting secure stream token from backend...');
            
            // 1. Get secure stream credentials from Node.js Backend
            const response = await axios.get(BACKEND_API_URL, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });

            const { streamUrl, srsApiUrl } = response.data;
            
            // 2. Start the WebRTC publishing process
            await startPublishing(streamUrl, srsApiUrl);

        } catch (error) {
            console.error('Token Request Error:', error);
            setStatus(`Token/Auth Failed: ${error.response?.statusText || error.message}`);
        }
    };

    const handleStop = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
            
            peerConnection.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
        }
        setIsLive(false);
        setStatus('Offline');
    };

    // Determine button state and styles
    const buttonText = isLive ? 'STOP STREAMING' : 'GO LIVE NOW';
    const buttonBaseClasses = 'py-4 px-12 border-none rounded-xl text-white font-extrabold text-2xl cursor-pointer transition duration-300 disabled:opacity-50 tracking-widest uppercase';
    const goButtonClasses = `bg-green-700 hover:bg-green-600 shadow-2xl shadow-green-900/50`;
    const stopButtonClasses = `bg-red-700 hover:bg-red-600 shadow-2xl shadow-red-900/50`;
    const isWorking = status.includes('Requesting');

    return (
        <div className="border border-gray-700 p-8 my-6 rounded-2xl shadow-2xl bg-gray-900 text-center">
            <h3 className="text-3xl font-bold mb-4 text-white flex justify-center items-center space-x-3">
                <span className={`w-4 h-4 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'} animate-pulse`}></span>
                LIVE STREAM CONTROL
            </h3>
            
            <p className={`text-xl mb-6 ${isLive ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                Status: {status}
            </p>
            
            <button
                onClick={handleGoLive}
                className={`${buttonBaseClasses} ${isLive ? stopButtonClasses : goButtonClasses}`}
                disabled={isWorking}
            >
                {buttonText}
            </button>
            
            {isLive && (
                <div className="mt-4 text-sm text-gray-500">
                    * Your audio is being published securely. Liquidsoap is mixing this with the auto-DJ music.
                </div>
            )}
        </div>
    );
}

export default GoLiveButton;