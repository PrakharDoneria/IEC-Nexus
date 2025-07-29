
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Get messages for a conversation
export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!ObjectId.isValid(params.conversationId)) {
      return NextResponse.json({ message: 'Invalid conversation ID' }, { status: 400 });
    }
    const conversationId = new ObjectId(params.conversationId);

    const client = await clientPromise;
    const db = client.db();

    // Verify user is part of the conversation
    const conversation = await db.collection('conversations').findOne({ _id: conversationId, participants: userId });
    if (!conversation) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const messages = await db.collection('messages')
        .aggregate([
            { $match: { conversationId } },
            { $sort: { timestamp: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: 'id',
                    as: 'senderInfo'
                }
            },
            { $unwind: '$senderInfo' },
            {
                $project: {
                    content: 1,
                    imageUrl: 1,
                    timestamp: 1,
                    senderId: 1,
                    sender: {
                        id: '$senderInfo.id',
                        name: '$senderInfo.name',
                        avatar: '$senderInfo.avatar',
                    }
                }
            }
        ])
        .toArray();
        
    const otherParticipantId = conversation.participants.find((p: string) => p !== userId);
    const participantDetails = await db.collection('users').findOne({ id: otherParticipantId });

    return NextResponse.json({ messages, participant: participantDetails });

  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Send a new message
export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
        const senderId = decodedToken.uid;

        if (!ObjectId.isValid(params.conversationId)) {
            return NextResponse.json({ message: 'Invalid conversation ID' }, { status: 400 });
        }
        const conversationId = new ObjectId(params.conversationId);
        
        const { content, imageUrl } = await req.json();
        if (!content && !imageUrl) {
            return NextResponse.json({ message: 'Message content cannot be empty' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Verify user is part of the conversation
        const conversation = await db.collection('conversations').findOne({ _id: conversationId, participants: senderId });
        if (!conversation) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const newMessage = {
            conversationId,
            senderId,
            content: content || "",
            imageUrl: imageUrl || null,
            timestamp: new Date(),
        };

        const result = await db.collection('messages').insertOne(newMessage);

        // Update the conversation with the last message
        const lastMessageContent = content || 'Image';
        await db.collection('conversations').updateOne(
            { _id: conversationId },
            { $set: { lastMessage: { _id: result.insertedId, content: lastMessageContent, timestamp: newMessage.timestamp, senderId } } }
        );

        // Fetch the sent message with sender info to return
         const createdMessage = await db.collection('messages').aggregate([
            { $match: { _id: result.insertedId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: 'id',
                    as: 'senderInfo'
                }
            },
            { $unwind: '$senderInfo' },
            {
                $project: {
                    content: 1,
                    imageUrl: 1,
                    timestamp: 1,
                    senderId: 1,
                    sender: {
                        id: '$senderInfo.id',
                        name: '$senderInfo.name',
                        avatar: '$senderInfo.avatar',
                    }
                }
            }
        ]).next();

        // TODO: Send push notification to other participant(s)

        return NextResponse.json(createdMessage, { status: 201 });

    } catch (error) {
        console.error('Error sending message:', error);
         if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
