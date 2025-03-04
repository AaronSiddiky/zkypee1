import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

export default function ChatWindow({ 
  contact, 
  messages, 
  onSendMessage,
  onStartCall,
  onEndCall,
  isInCall,
  callType
}) {
  const [newMessage, setNewMessage] = useState('');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle video call setup
  useEffect(() => {
    if (isInCall && callType === 'video' && localVideoRef.current) {
      // In a real app, this would be handled by WebRTC
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
          onEndCall(); // End call if media access fails
        });
      
      return () => {
        // Cleanup function to stop all tracks when component unmounts
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isInCall, callType, onEndCall]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  // Format timestamp for display
  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.timestamp), 'MMMM d, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {contact.avatar ? (
              <Image
                src={contact.avatar}
                alt={contact.name}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl font-semibold">
                {contact.name.charAt(0)}
              </div>
            )}
          </div>
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            contact.status === 'online' ? 'bg-green-500' : 
            contact.status === 'away' ? 'bg-yellow-500' : 
            contact.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
        </div>
        
        <div className="ml-3">
          <h2 className="font-medium text-gray-900">{contact.name}</h2>
          <p className="text-xs text-gray-500">
            {contact.status === 'online' ? 'Online' : 
             contact.status === 'away' ? 'Away' : 
             contact.status === 'busy' ? 'Busy' : 'Offline'}
          </p>
        </div>
        
        <div className="ml-auto flex space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={() => onStartCall('audio')}
            disabled={isInCall}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={() => onStartCall('video')}
            disabled={isInCall}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={() => setShowContactInfo(!showContactInfo)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className={`flex-1 flex flex-col ${showContactInfo ? 'hidden md:flex' : ''}`}>
          {isInCall ? (
            <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center relative">
              {callType === 'video' ? (
                <>
                  <div className="w-full h-full">
                    <video 
                      ref={remoteVideoRef} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      playsInline
                    />
                  </div>
                  <div className="absolute bottom-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
                    <video 
                      ref={localVideoRef} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      playsInline
                      muted
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                    <div className="text-4xl text-white">{contact.name.charAt(0)}</div>
                  </div>
                  <h3 className="text-xl text-white font-medium mb-2">{contact.name}</h3>
                  <p className="text-gray-400">Call in progress...</p>
                </div>
              )}
              
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button 
                  className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button 
                  className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700"
                  onClick={onEndCall}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
                {callType === 'video' && (
                  <button 
                    className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                        {date}
                      </div>
                    </div>
                    
                    {dateMessages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex mb-4 ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender !== 'me' && (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2 flex-shrink-0">
                            {contact.avatar ? (
                              <Image
                                src={contact.avatar}
                                alt={contact.name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-sm font-semibold">
                                {contact.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div 
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender === 'me' 
                              ? 'bg-blue-500 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex items-center">
                  <button 
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={!newMessage.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        
        {/* Contact info sidebar */}
        {showContactInfo && (
          <div className="w-64 border-l border-gray-200 bg-white p-4 hidden md:block">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto mb-3">
                {contact.avatar ? (
                  <Image
                    src={contact.avatar}
                    alt={contact.name}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-3xl font-semibold">
                    {contact.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
              <p className="text-sm text-gray-500">{contact.status}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Info</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-gray-600">{contact.email || 'email@example.com'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-gray-600">{contact.phone || '+1 (555) 123-4567'}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Media</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-100 rounded-md aspect-square"></div>
                <div className="bg-gray-100 rounded-md aspect-square"></div>
                <div className="bg-gray-100 rounded-md aspect-square"></div>
                <div className="bg-gray-100 rounded-md aspect-square"></div>
                <div className="bg-gray-100 rounded-md aspect-square"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 