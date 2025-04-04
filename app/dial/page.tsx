"use client";

import React, { useState, useEffect } from "react";
import PhoneDialer from "../../components/PhoneDialer";
import { useAuth } from "../../contexts/AuthContext";
import Auth from "../../components/Auth";
import { motion, AnimatePresence } from "framer-motion";
import { TwilioProvider } from "../../contexts/TwilioContext";

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
  status: string;
  error?: string;
}

export default function DialPage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dial' | 'sms'>('dial');
  const [number, setNumber] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to get the Twilio number
  const generateNumber = async () => {
    try {
      setLoading2(true);
      // Just return the configured Twilio number since we're using a fixed one
      setNumber('+18574129969');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading2(false);
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
    if (!number || activeTab !== 'sms') return;

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
  }, [number, activeTab]);

  return (
    <div className="h-screen bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex flex-col relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full filter blur-3xl"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full filter blur-xl"></div>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center pt-2 pb-4 px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Title and description on the left side - always visible */}
            <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md rounded-3xl p-7 border border-white/10 text-center md:text-left md:mt-[62px] flex flex-col h-auto">
              <h1 className="text-2xl md:text-2xl font-bold text-white mb-4 tracking-tight">Public Number</h1>
              <p className="text-md text-white/90 mb-5 font-medium">Your virtual telephone booth</p>
              <p className="text-sm leading-relaxed text-white/80 mb-6">
                Make anonymous outbound calls and receive SMS using a temporary number.
              </p>
              
              <div className="mt-auto pt-4">
                <div className="bg-white/5 px-5 py-4 rounded-xl backdrop-blur-sm shadow-sm border border-white/5">
                  <p className="text-white/90 text-sm mb-3">
                    Want a permanent number?
                  </p>
                  <a href="/buy-number" className="inline-block w-full bg-white/10 hover:bg-white/20 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors border border-white/10">
                    Get a private number
                  </a>
                </div>
              </div>
            </div>
            
            {/* Right side container - swaps content based on active tab */}
            <div className="w-full md:w-2/3">
              {/* Tabs - moved here to align with phone dialer container */}
              <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 mb-4 w-[340px] mx-auto md:mx-0 md:ml-20 shadow-lg">
                <button
                  onClick={() => setActiveTab('dial')}
                  className={`flex-1 py-2 px-4 rounded-full text-white font-medium transition-all text-center ${
                    activeTab === 'dial' 
                      ? 'bg-white/20 shadow-sm' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  Make Calls
                </button>
                <button
                  onClick={() => setActiveTab('sms')}
                  className={`flex-1 py-2 px-4 rounded-full text-white font-medium transition-all text-center ${
                    activeTab === 'sms' 
                      ? 'bg-white/20 shadow-sm' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  Receive SMS
                </button>
              </div>
              
              {activeTab === 'dial' ? (
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 inline-block mx-auto overflow-hidden md:ml-20" style={{width: "340px", height: "680px"}}>
                  <TwilioProvider>
                    <div className="p-0 flex justify-center">
                      <div className="transform scale-[0.83] origin-top pb-0 -mb-24 -mt-8">
                        {/* Title positioned closer to the actual content */}
                        <div className="mb-0">
                          <h2 className="text-2xl font-bold text-white">Phone Dialer</h2>
                        </div>
                        <PhoneDialer user={user} loading={loading} />
                      </div>
                    </div>
                  </TwilioProvider>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 inline-block mx-auto overflow-hidden md:ml-20" style={{width: "340px", height: "680px"}}>
                  <div className="p-0 flex justify-center">
                    <div className="transform scale-[0.83] origin-top pb-0 -mb-24 mt-6">
                      {/* SMS Content */}
                      <div className="w-full" style={{minHeight: "680px"}}>
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">Your Temporary Number</h2>
                          <p className="text-white/80 text-sm mb-5">
                            {number ? 'Use this number to receive SMS messages' : 'Generate a number to start receiving messages'}
                          </p>
                        </div>

                        <div className="mt-4 mb-6 min-h-[50px]">
                          <div className="bg-white/20 rounded-xl p-3 inline-block shadow-inner border border-white/10 min-w-[220px]">
                            <span className="text-xl md:text-2xl font-mono text-white">
                              {number ? number : '+1 (XXX) XXX-XXXX'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 mb-8">
                          <button 
                            onClick={generateNumber}
                            disabled={loading2}
                            className="w-full bg-white hover:bg-white/90 text-[#00AFF0] py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-md"
                          >
                            {loading2 ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#00AFF0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </span>
                            ) : (
                              number ? 'Generate New Number' : 'Generate Number'
                            )}
                          </button>
                          <button 
                            onClick={copyNumber}
                            disabled={!number}
                            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-md border border-white/10"
                          >
                            {copied ? (
                              <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Copied!
                              </span>
                            ) : (
                              <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                </svg>
                                Copy Number
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Messages Section */}
                        <div className="mb-16">
                          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                            </svg>
                            Received Messages
                          </h2>
                          
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {messages.length === 0 ? (
                              <div className="text-center py-20 bg-white/5 rounded-xl">
                                <svg
                                  className="mx-auto h-16 w-16 text-white/30"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                                <p className="mt-6 text-white/60 font-medium text-base">
                                  No messages received yet
                                </p>
                                <p className="text-white/40 text-sm mt-3">
                                  Messages will appear here automatically
                                </p>
                              </div>
                            ) : (
                              messages.map((message) => (
                                <div key={message.id} className="bg-white/10 rounded-lg p-2 border border-white/5 shadow-sm">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-white/80 font-medium flex items-center text-xs">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                      </svg>
                                      {message.from}
                                    </span>
                                    <span className="text-xs text-white/60 bg-white/5 px-1.5 py-0.5 rounded-full">
                                      {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                  <p className="text-white text-xs leading-relaxed">
                                    {message.body}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full border border-white/10"
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowAuth(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <Auth onSuccess={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add a global style for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
