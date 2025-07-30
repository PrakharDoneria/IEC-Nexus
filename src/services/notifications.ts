
'use server';

import admin from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';
import { NotificationSettings } from '@/lib/types';


type NotificationCategory = keyof NotificationSettings;

export async function sendNotification(userId: string, title: string, body: string, link: string, category: NotificationCategory) {
  try {
    const messaging = admin.messaging();
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ id: userId });

    if (!user || !user.fcmToken) {
      console.log(`User ${userId} not found or has no FCM token.`);
      return;
    }

    // Check user's notification settings
    const settings: NotificationSettings = {
      newFollower: true,
      postLike: true,
      postComment: true,
      groupInvite: true,
      directMessage: true,
      groupAnnouncement: true,
      groupMessage: true,
      ...user.notificationSettings, // User's settings override defaults
    };

    if (settings[category] === false) {
        console.log(`User ${userId} has disabled notifications for ${category}.`);
        return;
    }


    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: link,
        },
        notification: {
          icon: '/icon-192x192.png'
        }
      },
    };

    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
