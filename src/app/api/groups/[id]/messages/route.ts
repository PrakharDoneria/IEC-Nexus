
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Get messages for a group
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

    const group = await db.collection('groups').findOne({ _id: groupId, members: userId });
    if (!group) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const messages = await db.collection('groupMessages')
        .find({ groupId })
        .sort({ timestamp: 1 })
        .toArray();

    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error fetching group messages:', error);
    if (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error')) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Send a new message to a group
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
        const senderId = decodedToken.uid;

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ message: 'Invalid group ID' }, { status: 400 });
        }
        const groupId = new ObjectId(params.id);
        
        const { content } = await req.json();
        if (!content) {
            return NextResponse.json({ message: 'Message content cannot be empty' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const group = await db.collection('groups').findOne({ _id: groupId, members: senderId });
        if (!group) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const newMessage = {
            groupId,
            senderId,
            content,
            timestamp: new Date(),
            reactions: [],
            isEdited: false,
        };

        const result = await db.collection('groupMessages').insertOne(newMessage);
        const createdMessage = await db.collection('groupMessages').findOne({_id: result.insertedId});

        // TODO: Add push notifications to other group members

        return NextResponse.json(createdMessage, { status: 201 });

    } catch (error) {
        console.error('Error sending group message:', error);
         if (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
