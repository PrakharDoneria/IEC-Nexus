
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';
import { NotificationSettings } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ id: uid });

    if (!user) {
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
    }
    
    // Don't send back the mongo _id
    const { _id, ...userWithoutId } = user;

    return NextResponse.json(userWithoutId);

  } catch (error) {
    console.error('Error fetching current user:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { name, bio, avatar, notificationSettings } = await req.json();

    const updateData: { [key: string]: any } = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;


    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('users').updateOne(
      { id: uid },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
       return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Also update display name in Firebase Auth if it changed
    if(name) {
      await getAuth(admin.app()).updateUser(uid, { displayName: name });
    }

    const updatedUser = await db.collection('users').findOne({ id: uid });
    const { _id, ...userWithoutId } = updatedUser!;


    return NextResponse.json(userWithoutId);

  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
