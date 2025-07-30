
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { sendNotification } from '@/services/notifications';

// Get announcements for a group
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

    const group = await db.collection('groups').findOne({ _id: groupId, "members.userId": userId });
    if (!group) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const announcements = await db.collection('groupAnnouncements')
        .aggregate([
            { $match: { groupId } },
            { $sort: { timestamp: -1 } },
            { $lookup: { from: 'users', localField: 'authorId', foreignField: 'id', as: 'authorInfo' }},
            { $unwind: '$authorInfo' },
            { $project: {
                content: 1,
                timestamp: 1,
                author: { id: '$authorInfo.id', name: '$authorInfo.name', avatar: '$authorInfo.avatar' }
            }}
        ])
        .toArray();

    return NextResponse.json(announcements);

  } catch (error) {
    console.error('Error fetching announcements:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Post a new announcement (faculty only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
        const authorId = decodedToken.uid;

        if (decodedToken.role !== 'Faculty') {
            return NextResponse.json({ message: 'Only faculty can post announcements' }, { status: 403 });
        }

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ message: 'Invalid group ID' }, { status: 400 });
        }
        const groupId = new ObjectId(params.id);
        
        const { content } = await req.json();
        if (!content) {
            return NextResponse.json({ message: 'Announcement content cannot be empty' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const group = await db.collection('groups').findOne({ _id: groupId, "members.userId": authorId });
        if (!group) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const newAnnouncement = {
            groupId,
            authorId,
            content,
            timestamp: new Date(),
        };

        await db.collection('groupAnnouncements').insertOne(newAnnouncement);

        // Send notifications to all group members except the author
        const notificationTitle = `New announcement in ${group.name}`;
        const notificationBody = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        const notificationLink = `/groups/${group._id}`;
        
        const membersToNotify = group.members.filter((m: any) => m.userId !== authorId).map((m:any) => m.userId);
        for (const memberId of membersToNotify) {
            await sendNotification(memberId, notificationTitle, notificationBody, notificationLink, 'groupAnnouncement');
        }

        return NextResponse.json(newAnnouncement, { status: 201 });

    } catch (error) {
        console.error('Error creating announcement:', error);
         if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
