
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Get all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const client = await clientPromise;
    const db = client.db();

    const conversations = await db.collection('conversations')
        .aggregate([
            { $match: { participants: userId } },
            { $sort: { 'lastMessage.timestamp': -1 } },
            {
                $lookup: {
                    from: 'users',
                    let: { participants: '$participants' },
                    pipeline: [
                        { $match: { $expr: { $and: [ { $in: ['$id', '$$participants'] }, { $ne: ['$id', userId] } ] } } }
                    ],
                    as: 'participantDetails'
                }
            },
            { $unwind: { path: '$participantDetails', preserveNullAndEmptyArrays: true } },
            { $project: {
                _id: 1,
                lastMessage: 1,
                participant: '$participantDetails'
            }}
        ])
        .toArray();

    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Error fetching conversations:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Start a new conversation
export async function POST(req: NextRequest) {
    try {
        const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;

        const { recipientId } = await req.json();
        if (!recipientId) {
            return NextResponse.json({ message: 'Recipient ID is required' }, { status: 400 });
        }
        
        if (currentUserId === recipientId) {
            return NextResponse.json({ message: 'Cannot start a conversation with yourself' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Check if a conversation already exists
        let conversation = await db.collection('conversations').findOne({
            participants: { $all: [currentUserId, recipientId], $size: 2 }
        });

        if (conversation) {
            return NextResponse.json({ conversationId: conversation._id, message: 'Conversation already exists' }, { status: 200 });
        }

        // Create a new conversation
        const newConversation = {
            participants: [currentUserId, recipientId],
            createdAt: new Date(),
        };

        const result = await db.collection('conversations').insertOne(newConversation);

        return NextResponse.json({ conversationId: result.insertedId, message: 'Conversation created' }, { status: 201 });

    } catch (error) {
        console.error('Error starting conversation:', error);
        if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
