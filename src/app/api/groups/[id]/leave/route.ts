
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid group ID' }, { status: 400 });
    }
    const groupId = new ObjectId(params.id);

    const client = await clientPromise;
    const db = client.db();

    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy === userId) {
        return NextResponse.json({ message: 'Owner cannot leave the group. You must delete it instead.' }, { status: 400 });
    }

    const result = await db.collection('groups').updateOne(
      { _id: groupId },
      { $pull: { members: { userId: userId } } }
    );
    
    if (result.modifiedCount === 0) {
        return NextResponse.json({ message: 'You are not a member of this group.' }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'You have left the group.' }, { status: 200 });

  } catch (error) {
    console.error('Error leaving group:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
