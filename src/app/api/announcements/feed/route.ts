
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Get latest announcements from user's groups for the feed
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

    // 1. Find all groups the user is a member of
    const userGroups = await db.collection('groups').find(
        { "members.userId": userId },
        { projection: { _id: 1 } }
    ).toArray();
    
    if (userGroups.length === 0) {
        return NextResponse.json([]); // No groups, no announcements
    }

    const groupIds = userGroups.map(g => g._id);

    // 2. Fetch the latest 5 announcements from those groups
    const announcements = await db.collection('groupAnnouncements')
        .aggregate([
            { $match: { groupId: { $in: groupIds } } },
            { $sort: { timestamp: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: 'authorId', foreignField: 'id', as: 'authorInfo' }},
            { $lookup: { from: 'groups', localField: 'groupId', foreignField: '_id', as: 'groupInfo' }},
            { $unwind: '$authorInfo' },
            { $unwind: '$groupInfo' },
            { $project: {
                _id: 1,
                content: 1,
                timestamp: 1,
                imageUrl: 1,
                attachmentLink: 1,
                author: { name: '$authorInfo.name' },
                group: { _id: '$groupInfo._id', name: '$groupInfo.name' }
            }}
        ])
        .toArray();

    return NextResponse.json(announcements);

  } catch (error) {
    console.error('Error fetching group announcements for feed:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
