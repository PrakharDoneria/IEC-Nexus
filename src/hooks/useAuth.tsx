
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from './use-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  authLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup', '/'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

   const requestNotificationPermission = useCallback(async (token: string) => {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      try {
        const messaging = getMessaging(app);
        // Use your VAPID key from the Firebase console
        const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (fcmToken) {
          console.log('FCM Token:', fcmToken);
          await fetch('/api/users/fcm-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token: fcmToken })
          });
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });
        return () => {
            unsubscribe();
        };
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdToken();
        setIdToken(token);
        
        // Fetch user profile from our DB
        const res = await fetch('/api/users/current', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            const profile = await res.json();
            setUser(profile);
            requestNotificationPermission(token);
        } else {
            // Handle case where user exists in Firebase but not in DB
            setUser(null);
            await auth.signOut();
        }

        if (publicRoutes.includes(pathname)) {
            router.push('/feed');
        }

      } else {
        setFirebaseUser(null);
        setUser(null);
        setIdToken(null);
        if (!publicRoutes.includes(pathname)) {
            router.push('/login');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, requestNotificationPermission]);

  const logout = async () => {
    const auth = getAuth(app);
    await auth.signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, idToken, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
