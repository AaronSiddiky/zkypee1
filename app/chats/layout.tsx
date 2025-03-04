import React from 'react';

export const metadata = {
  title: 'Chats | VoIP Service',
  description: 'Chat with your contacts using our messaging service',
};

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
} 