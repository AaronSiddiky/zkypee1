"use client";

import React, { useState, useEffect } from "react";
import ChatSidebar from "../../components/ChatSidebar";
import ChatWindow from "../../components/ChatWindow";
import EmptyState from "../../components/EmptyState";
import AddFriendModal from "../../components/AddFriendModal";

// Define types
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
  email?: string;
}

interface Message {
  id: string;
  sender: "me" | string;
  text: string;
  timestamp: string;
}

type Conversations = {
  [key: string]: Message[];
};

// Mock data for contacts and conversations
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    avatar: "/avatars/avatar1.png",
    status: "online",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    avatar: "/avatars/avatar2.png",
    status: "away",
  },
  {
    id: "3",
    name: "Michael Brown",
    avatar: "/avatars/avatar3.png",
    status: "offline",
  },
  {
    id: "4",
    name: "Emily Davis",
    avatar: "/avatars/avatar4.png",
    status: "online",
  },
  {
    id: "5",
    name: "David Wilson",
    avatar: "/avatars/avatar5.png",
    status: "busy",
  },
];

const mockConversations: Conversations = {
  "1": [
    {
      id: "m1",
      sender: "1",
      text: "Hey there! How are you?",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "m2",
      sender: "me",
      text: "I'm good, thanks! How about you?",
      timestamp: new Date(Date.now() - 86000000).toISOString(),
    },
    {
      id: "m3",
      sender: "1",
      text: "Doing well. Just wanted to catch up.",
      timestamp: new Date(Date.now() - 85000000).toISOString(),
    },
    {
      id: "m4",
      sender: "me",
      text: "Sure, what's new?",
      timestamp: new Date(Date.now() - 84000000).toISOString(),
    },
    {
      id: "m5",
      sender: "1",
      text: "Not much, just working on some projects. How about you?",
      timestamp: new Date(Date.now() - 83000000).toISOString(),
    },
    {
      id: "m6",
      sender: "me",
      text: "Same here. Been pretty busy with work lately.",
      timestamp: new Date(Date.now() - 82000000).toISOString(),
    },
    {
      id: "m7",
      sender: "1",
      text: "We should catch up sometime soon!",
      timestamp: new Date(Date.now() - 81000000).toISOString(),
    },
    {
      id: "m8",
      sender: "me",
      text: "Definitely! How about next week?",
      timestamp: new Date(Date.now() - 80000000).toISOString(),
    },
    {
      id: "m9",
      sender: "1",
      text: "Sounds good to me. I'll check my schedule and let you know.",
      timestamp: new Date(Date.now() - 79000000).toISOString(),
    },
  ],
  "2": [
    {
      id: "m10",
      sender: "2",
      text: "Hi! Did you get the files I sent?",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "m11",
      sender: "me",
      text: "Yes, I got them. Thanks!",
      timestamp: new Date(Date.now() - 172700000).toISOString(),
    },
    {
      id: "m12",
      sender: "2",
      text: "Great! Let me know if you need anything else.",
      timestamp: new Date(Date.now() - 172600000).toISOString(),
    },
  ],
  "3": [
    {
      id: "m13",
      sender: "me",
      text: "Hey Michael, are we still meeting tomorrow?",
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: "m14",
      sender: "3",
      text: "Yes, 2pm at the coffee shop works for me.",
      timestamp: new Date(Date.now() - 259100000).toISOString(),
    },
    {
      id: "m15",
      sender: "me",
      text: "Perfect, see you then!",
      timestamp: new Date(Date.now() - 259000000).toISOString(),
    },
  ],
};

export default function ChatsPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversations, setConversations] =
    useState<Conversations>(mockConversations);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sending a new message
  const handleSendMessage = (text: string) => {
    if (!selectedContact || !text.trim()) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: "me",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage],
    }));
  };

  // Start a call
  const handleStartCall = (type: "audio" | "video") => {
    setCallType(type);
    setIsInCall(true);
    alert(
      `Starting ${type} call with ${selectedContact?.name}. This feature is coming soon!`
    );
    // In a real implementation, this would initiate a WebRTC connection
  };

  // End a call
  const handleEndCall = () => {
    setIsInCall(false);
    setCallType(null);
  };

  // Add a new friend
  const handleAddFriend = (name: string, email: string) => {
    const newId = `${contacts.length + 1}`;
    const newContact: Contact = {
      id: newId,
      name,
      email,
      status: "offline",
      avatar: undefined,
    };

    setContacts((prev) => [...prev, newContact]);

    // Create an empty conversation for the new contact
    setConversations((prev) => ({
      ...prev,
      [newId]: [],
    }));

    // Optionally select the new contact
    setSelectedContact(newContact);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat sidebar with contacts */}
      <ChatSidebar
        contacts={filteredContacts}
        selectedContactId={selectedContact?.id || null}
        onSelectContact={(contact: Contact) => setSelectedContact(contact)}
        conversations={conversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddFriendClick={() => setShowAddFriendModal(true)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <ChatWindow
            contact={selectedContact}
            messages={conversations[selectedContact.id] || []}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            isInCall={isInCall}
            callType={callType}
          />
        ) : (
          <EmptyState
            icon="chat"
            title="Select a conversation"
            description="Choose a contact from the sidebar to start chatting"
          />
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={handleAddFriend}
      />
    </div>
  );
}
