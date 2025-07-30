
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, BellOff } from 'lucide-react';
import app from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export function NotificationPermissionManager() {
  const { idToken } = useAuth();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');

  const checkPermission = useCallback(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);
      // Only show the dialog if permission is 'default' (not yet asked)
      // Or if it's denied, to inform the user how to change it.
      if (currentPermission === 'default' || currentPermission === 'denied') {
        setShowPermissionDialog(true);
      }
    }
  }, []);

  useEffect(() => {
    // Only run this check on the client-side
    if (typeof window !== 'undefined') {
        // Wait a bit before checking, so it's not too intrusive.
        const timer = setTimeout(checkPermission, 3000);
        return () => clearTimeout(timer);
    }
  }, [checkPermission]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Push notifications not supported.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setShowPermissionDialog(false); // Close dialog after interaction

      if (permission === 'granted' && idToken) {
        // Now that permission is granted, get the token
        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (fcmToken) {
          // Send the token to your server
          await fetch('/api/users/fcm-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ token: fcmToken }),
          });
        }
      }
    } catch (error) {
      console.error('An error occurred while requesting permission. ', error);
    }
  };

  if (permissionStatus === 'granted') {
    return null; // Don't render anything if permission is already granted.
  }

  return (
    <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {permissionStatus === 'denied' ? (
                <div className="p-3 bg-destructive text-destructive-foreground rounded-full border">
                    <BellOff className="h-10 w-10" />
                </div>
            ) : (
                <div className="p-3 bg-primary text-primary-foreground rounded-full border">
                    <BellRing className="h-10 w-10" />
                </div>
            )}
          </div>
          <DialogTitle className="text-center text-2xl">
            {permissionStatus === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
            </DialogTitle>
          <DialogDescription className="text-center">
            {permissionStatus === 'denied' ? (
              "You have previously blocked notifications. To enable them, please go to your browser's site settings for this page and change the notification permission to 'Allow'."
            ) : (
              "Stay up-to-date with new messages, followers, and important announcements. Allow notifications to get the best experience."
            )}
          </DialogDescription>
        </DialogHeader>
        {permissionStatus !== 'denied' && (
             <DialogFooter>
                <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>Maybe Later</Button>
                <Button onClick={requestPermission}>Enable Notifications</Button>
             </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
