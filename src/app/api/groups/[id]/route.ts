
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { User } from '@/lib/types';


// Get a single group's details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    if (!group.members.includes(userId)) {
         return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Populate member details
    const members = await db.collection<User>('users').find(
        { id: { $in: group.members } },
        { projection: { name: 1, avatar: 1, role: 1, id: 1, email: 1 } }
    ).toArray();

    group.members = members;


    return NextResponse.json(group, { status: 200 });

  } catch (error) {
    console.error('Error fetching group details:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Update a group's details (owner only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

        const { name, description } = await req.json();
        if (!name || !description) {
            return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('groups').updateOne(
            { _id: groupId, createdBy: userId },
            { $set: { name, description } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: 'Group not found or you do not have permission to edit it' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Group updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error updating group:', error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
