
"use client";

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getMessaging, onMessage } from 'firebase/messaging';
import app from '@/lib/firebase';
import { toast } from './use-toast';
import { usePathname } from 'next/navigation';

type EventType = `conversation:${string}` | `group:${string}` | '*';
type Listener = () => void;

interface RealtimeContextType {
  addListener: (event: EventType, listener: Listener) => () => void;
  removeListener: (event: EventType, listener: Listener) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// A simple event emitter
class EventEmitter {
  private listeners: Map<EventType, Set<Listener>> = new Map();

  on(event: EventType, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: EventType, listener: Listener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
  }

  emit(event: EventType) {
    // Notify specific listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => listener());
    }
    // Notify wildcard listeners
    if (this.listeners.has('*')) {
        this.listeners.get('*')!.forEach(listener => listener());
    }
  }
}

const eventEmitter = new EventEmitter();

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { idToken } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && idToken) {
        try {
            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received in foreground. ', payload);
                const link = payload.data?.link as string | undefined;

                if (link) {
                    if (link.startsWith('/messages/')) {
                        const conversationId = link.split('/')[2];
                        eventEmitter.emit(`conversation:${conversationId}`);
                    } else if (link.startsWith('/groups/')) {
                         const groupId = link.split('/')[2];
                         eventEmitter.emit(`group:${groupId}`);
                    }
                }
                eventEmitter.emit('*'); // Wildcard for lists/badges

                // Don't show toast if user is already in the relevant chat window
                if (!pathname.startsWith(link || '///')) {
                    toast({
                        title: payload.notification?.title,
                        description: payload.notification?.body,
                    });
                }
            });
            return () => unsubscribe();
        } catch(e) {
            console.error("Error setting up foreground message listener:", e);
        }
    }
  }, [idToken, pathname]);

  const addListener = useCallback((event: EventType, listener: Listener) => {
    eventEmitter.on(event, listener);
    // Return a function to remove the listener
    return () => eventEmitter.off(event, listener);
  }, []);

  const removeListener = useCallback((event: EventType, listener: Listener) => {
    eventEmitter.off(event, listener);
  }, []);

  return (
    <RealtimeContext.Provider value={{ addListener, removeListener }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
