
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Join a group
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ message: 'Invite code is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find group by invite code
    const group = await db.collection('groups').findOne({ inviteCode });

    if (!group) {
        // Find group by ID (if an ObjectId is passed)
        if (ObjectId.isValid(inviteCode)) {
            const groupById = await db.collection('groups').findOne({ _id: new ObjectId(inviteCode) });
             if (!groupById) {
                return NextResponse.json({ message: 'Invalid invite code or group ID' }, { status: 404 });
            }
            // Add user to the group's members array if they aren't already in it
            const resultById = await db.collection('groups').updateOne(
                { _id: groupById._id },
                { $addToSet: { members: userId } }
            );

            if (resultById.modifiedCount === 0) {
                return NextResponse.json({ message: 'You are already a member of this group', groupId: groupById._id }, { status: 200 });
            }

            return NextResponse.json({ message: 'Successfully joined group', groupId: groupById._id }, { status: 200 });
        }
        return NextResponse.json({ message: 'Invalid invite code' }, { status: 404 });
    }

    // Add user to the group's members array if they aren't already in it
    const result = await db.collection('groups').updateOne(
        { _id: group._id },
        { $addToSet: { members: userId } }
    );

    if (result.modifiedCount === 0) {
        return NextResponse.json({ message: 'You are already a member of this group', groupId: group._id }, { status: 200 });
    }

    return NextResponse.json({ message: 'Successfully joined group', groupId: group._id }, { status: 200 });

  } catch (error) {
    console.error('Error joining group:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
