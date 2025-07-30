
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Update a member's role
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid group ID' }, { status: 400 });
    }
    const groupId = new ObjectId(params.id);

    const { memberId, role } = await req.json();
    if (!memberId || !role || !['moderator', 'member'].includes(role)) {
        return NextResponse.json({ message: 'Valid memberId and role are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const group = await db.collection('groups').findOne({ _id: groupId });

    if (!group || group.createdBy !== currentUserId) {
        return NextResponse.json({ message: 'Forbidden: Only the owner can change roles.' }, { status: 403 });
    }
    
    if (memberId === currentUserId) {
        return NextResponse.json({ message: 'Owner role cannot be changed.' }, { status: 400 });
    }

    const result = await db.collection('groups').updateOne(
      { _id: groupId, 'members.userId': memberId },
      { $set: { 'members.$.role': role } }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ message: 'Member not found in this group.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member role updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating member role:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
