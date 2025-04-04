"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function VoiceCallPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Request microphone permissions
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
        setIsConnected(true);
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    }

    setupMedia();

    // Start call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(timer);
      if (audioRef.current?.srcObject) {
        const tracks = (audioRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current?.srcObject) {
      const audioTracks = (audioRef.current.srcObject as MediaStream).getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <audio ref={audioRef} autoPlay />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-2xl p-8 max-w-md w-full"
      >
        {/* User Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-[#00AFF0] rounded-full flex items-center justify-center text-white text-3xl font-semibold mx-auto mb-4">
            J
          </div>
          <h2 className="text-white text-2xl font-semibold mb-2">John Doe</h2>
          <p className="text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>

        {/* Call Duration */}
        <div className="text-center mb-12">
          <p className="text-white text-4xl font-mono">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center items-center space-x-1 mb-12">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#00AFF0]"
              animate={{
                height: Math.random() * 40 + 10
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.1
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500' : 'bg-[#00AFF0]'
            } text-white hover:opacity-90 transition-opacity`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMuted
                    ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                }
              />
            </svg>
          </button>

          <button
            className="p-4 rounded-full bg-red-500 text-white hover:opacity-90 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <button
            className="p-4 rounded-full bg-[#00AFF0] text-white hover:opacity-90 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
} 