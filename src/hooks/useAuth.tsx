
"use client";

import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import app from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const fetchUserProfile = useCallback(async (token: string) => {
    const res = await fetch('/api/users/current', {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
        const profile = await res.json();
        setUser(profile);
        return profile;
    } else {
        const auth = getAuth(app);
        await auth.signOut();
        return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    if (currentUser) {
        const token = await currentUser.getIdToken(true); // Force refresh
        setIdToken(token);
        await fetchUserProfile(token);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdToken();
        setIdToken(token);
        
        await fetchUserProfile(token);

        if (publicRoutes.includes(pathname)) {
            router.push('/feed');
        }

      } else {
        if (fbUser && !fbUser.emailVerified) {
           // User exists but email is not verified. Let them go to login page to see verification message.
        }
        setFirebaseUser(null);
        setUser(null);
        setIdToken(null);
        if (!publicRoutes.includes(pathname) && !pathname.startsWith('/posts/')) {
            router.push('/login');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, fetchUserProfile]);

  const logout = async () => {
    const auth = getAuth(app);
    await auth.signOut();
    router.push('/login');
  };

  if (authLoading && !user && !publicRoutes.includes(pathname) && !pathname.startsWith('/posts/')) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, idToken, authLoading, logout, refreshUser }}>
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
