
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;
    const userToFollowId = params.id;

    if (currentUserId === userToFollowId) {
        return NextResponse.json({ message: 'You cannot follow yourself' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const currentUser = await usersCollection.findOne({ id: currentUserId });
    const userToFollow = await usersCollection.findOne({ id: userToFollowId });

    if (!userToFollow) {
      return NextResponse.json({ message: 'User to follow not found' }, { status: 404 });
    }
    
    const isFollowing = currentUser?.following?.includes(userToFollowId);

    if (isFollowing) {
      // Unfollow
      await usersCollection.updateOne({ id: currentUserId }, { $pull: { following: userToFollowId } });
      await usersCollection.updateOne({ id: userToFollowId }, { $pull: { followers: currentUserId } });
      return NextResponse.json({ message: 'Successfully unfollowed user', isFollowing: false });
    } else {
      // Follow
      await usersCollection.updateOne({ id: currentUserId }, { $addToSet: { following: userToFollowId } });
      await usersCollection.updateOne({ id: userToFollowId }, { $addToSet: { followers: currentUserId } });
      return NextResponse.json({ message: 'Successfully followed user', isFollowing: true });
    }

  } catch (error) {
    console.error('Error following/unfollowing user:', error);
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

