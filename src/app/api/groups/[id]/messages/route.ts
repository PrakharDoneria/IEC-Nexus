
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { sendNotification } from '@/services/notifications';
import { User } from '@/lib/types';

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

    const group = await db.collection('groups').findOne({ _id: groupId, 'members.userId': userId });
    if (!group) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const messages = await db.collection('groupMessages')
        .aggregate([
            { $match: { groupId } },
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
                    timestamp: 1,
                    senderId: 1,
                    reactions: 1,
                    isEdited: 1,
                    isDeleted: 1,
                    sender: {
                        id: '$senderInfo.id',
                        name: '$senderInfo.name',
                        avatar: '$senderInfo.avatar',
                    }
                }
            }
        ])
        .toArray();

    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error fetching group messages:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
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

        const group = await db.collection('groups').findOne({ _id: groupId, 'members.userId': senderId });
        if (!group) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        
        const sender = await db.collection<User>('users').findOne({ id: senderId });
        if (!sender) {
             return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
        }


        const newMessage = {
            groupId,
            senderId,
            content,
            timestamp: new Date(),
            reactions: [],
            isEdited: false,
            isDeleted: false,
        };

        const result = await db.collection('groupMessages').insertOne(newMessage);
        
        const createdMessage = await db.collection('groupMessages').aggregate([
           { $match: { _id: result.insertedId } },
           { $lookup: { from: 'users', localField: 'senderId', foreignField: 'id', as: 'senderInfo' }},
           { $unwind: '$senderInfo' },
           { $project: {
                content: 1,
                timestamp: 1,
                senderId: 1,
                reactions: 1,
                isEdited: 1,
                isDeleted: 1,
                sender: { id: '$senderInfo.id', name: '$senderInfo.name', avatar: '$senderInfo.avatar' }
           }}
        ]).next();


        // Send notifications to all group members except the author
        const notificationTitle = `New message in ${group.name} from ${sender.name}`;
        const notificationBody = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        const notificationLink = `/groups/${group._id.toString()}`;
        
        const membersToNotify = (group.members as any[]).filter(m => m.userId !== senderId).map(m => m.userId);
        for (const memberId of membersToNotify) {
            await sendNotification(memberId, notificationTitle, notificationBody, notificationLink, 'groupMessage');
        }


        return NextResponse.json(createdMessage, { status: 201 });

    } catch (error) {
        console.error('Error sending group message:', error);
         if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
