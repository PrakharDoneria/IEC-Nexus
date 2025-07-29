
'use server';

import admin from 'firebase-admin';
import clientPromise from '@/lib/mongodb';

const messaging = admin.messaging();

export async function sendNotification(userId: string, title: string, body: string, link: string) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ id: userId });

    if (!user || !user.fcmToken) {
      console.log(`User ${userId} not found or has no FCM token.`);
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
