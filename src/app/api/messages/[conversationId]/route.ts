
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { sendNotification } from '@/services/notifications';

// Get messages for a conversation and mark as read
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
    
    // Mark messages as read by the current user
    await db.collection('messages').updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    
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
                    readBy: 1,
                    reactions: 1,
                    isEdited: 1,
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
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
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
        const senderName = decodedToken.name || 'A user';

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
            readBy: [senderId], // Sender has read the message by default
            reactions: [],
        };

        const result = await db.collection('messages').insertOne(newMessage);

        // Update the conversation with the last message
        await db.collection('conversations').updateOne(
            { _id: conversationId },
            { $set: { lastMessage: { ...newMessage, _id: result.insertedId } } }
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
                    readBy: 1,
                    reactions: 1,
                    sender: {
                        id: '$senderInfo.id',
                        name: '$senderInfo.name',
                        avatar: '$senderInfo.avatar',
                    }
                }
            }
        ]).next();
        
        // Send push notification to other participant(s)
        const recipientId = conversation.participants.find((p: string) => p !== senderId);
        if (recipientId) {
             const notificationTitle = `New message from ${senderName}`;
             const notificationBody = content ? (content.substring(0, 100) + (content.length > 100 ? '...' : '')) : 'Sent an image';
             const notificationLink = `/messages/${conversationId}`;
             await sendNotification(recipientId, notificationTitle, notificationBody, notificationLink, 'directMessage');
        }

        return NextResponse.json(createdMessage, { status: 201 });

    } catch (error) {
        console.error('Error sending message:', error);
         if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
