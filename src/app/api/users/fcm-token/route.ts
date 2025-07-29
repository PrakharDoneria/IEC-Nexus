
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { token } = await req.json();
    if (!token) {
        return NextResponse.json({ message: 'FCM token is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').updateOne(
        { id: uid },
        { $set: { fcmToken: token } }
    );

    return NextResponse.json({ message: 'FCM token updated successfully' });

  } catch (error: any) {
    console.error('Error updating FCM token:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
