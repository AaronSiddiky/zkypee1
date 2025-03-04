import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function ChatSidebar({ 
  contacts, 
  selectedContactId, 
  onSelectContact, 
  conversations,
  searchQuery,
  onSearchChange,
  onAddFriendClick
}) {
  // Get the last message for each contact
  const getLastMessage = (contactId) => {
    const conversation = conversations[contactId] || [];
    return conversation.length > 0 ? conversation[conversation.length - 1] : null;
  };

  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get status indicator color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
          <button 
            onClick={onAddFriendClick}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="Add a friend"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((contact) => {
          const lastMessage = getLastMessage(contact.id);
          
          return (
            <div 
              key={contact.id}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContactId === contact.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    {contact.avatar ? (
                      <Image
                        src={contact.avatar}
                        alt={contact.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-xl font-semibold">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(contact.status)}`}></div>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {lastMessage ? (
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage.sender === 'me' ? 'You: ' : ''}
                      {lastMessage.text}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {contacts.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No contacts found
          </div>
        )}
      </div>
    </div>
  );
} 