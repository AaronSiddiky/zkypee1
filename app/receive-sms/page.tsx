"use client";

import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
}

export default function ReceiveSMSPage() {
  const [number, setNumber] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to get the Twilio number
  const generateNumber = async () => {
    try {
      setLoading(true);
      // Just return the configured Twilio number since we're using a fixed one
      setNumber('+18574129969');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to copy number to clipboard
  const copyNumber = async () => {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (!number) return;

    const fetchMessages = async () => {
      try {
        console.log('Attempting to fetch messages for number:', number);
        const response = await fetch(`/api/sms/messages?number=${number}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        console.log('Successfully received messages:', data);
        setMessages(data);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [number]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00AFF0] to-[#0085B3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Receive SMS Online
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Get a free temporary phone number to receive SMS messages online
          </p>
        </div>

        {/* Phone Number Section */}
        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Temporary Number</h2>
            <div className="bg-white/20 rounded-lg p-4 inline-block">
              <span className="text-3xl font-mono text-white">
                {number ? number : '+1 (XXX) XXX-XXXX'}
              </span>
            </div>
            <p className="text-white/60 mt-4">
              {number ? 'Use this number to receive SMS messages' : 'Generate a number to start receiving messages'}
            </p>
          </div>
          
          <div className="grid gap-4">
            <button 
              onClick={generateNumber}
              disabled={loading}
              className="w-full bg-white text-[#00AFF0] py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : number ? 'Generate New Number' : 'Generate Number'}
            </button>
            <button 
              onClick={copyNumber}
              disabled={!number}
              className="w-full bg-white/10 text-white py-3 rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {copied ? 'Copied!' : 'Copy Number'}
            </button>
          </div>
        </div>

        {/* Messages Section */}
        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Received Messages</h2>
          
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="mt-4 text-white/60">
                  No messages received yet. Messages will appear here automatically.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white/80">From: {message.from}</span>
                    <span className="text-sm text-white/60">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white">
                    {message.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-5xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Features & Benefits
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-white mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">100% Private</h3>
              <p className="text-white/80">
                Keep your real phone number private when signing up for services
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-white mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant</h3>
              <p className="text-white/80">
                Receive SMS messages instantly in your browser
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="text-white mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Installation</h3>
              <p className="text-white/80">
                Works directly in your browser, no apps or downloads needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 