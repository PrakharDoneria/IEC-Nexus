
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
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'default') {
        setShowPermissionDialog(true);
      } else if (Notification.permission === 'denied') {
        setShowPermissionDialog(true); // Also show for denied, but with a different message
      }
    }
  }, []);

  useEffect(() => {
    // Check permission after a short delay to not be too intrusive on page load
    const timer = setTimeout(checkPermission, 2000);
    return () => clearTimeout(timer);
  }, [checkPermission]);

  const requestPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
      console.log('Push notifications not supported or VAPID key missing.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted' && idToken) {
        setShowPermissionDialog(false);
        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (fcmToken) {
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
