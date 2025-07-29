
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Conversation } from '@/lib/types';
import { usePathname } from 'next/navigation';

interface UnreadCountContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  fetchUnreadCount: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export const UnreadCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { idToken, authLoading } = useAuth();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    if (!idToken) {
        setConversations([]);
        return;
    };

    try {
      const res = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
      setConversations([]);
    }
  }, [idToken]);

  useEffect(() => {
    if (!authLoading && idToken) {
      fetchUnreadCount(); // Initial fetch
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [authLoading, idToken, fetchUnreadCount]);
  
  // When user navigates to the messages page, refresh count
  useEffect(() => {
    if (pathname.startsWith('/messages')) {
        fetchUnreadCount();
    }
  }, [pathname, fetchUnreadCount]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, convo) => acc + (convo.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <UnreadCountContext.Provider value={{ conversations, totalUnreadCount, fetchUnreadCount }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (context === undefined) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
};
