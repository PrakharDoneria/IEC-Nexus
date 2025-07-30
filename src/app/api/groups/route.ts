
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

// Get groups for the current user
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

    const groups = await db.collection('groups')
      .aggregate([
        { $match: { members: userId } },
        {
          $addFields: {
            memberCount: { $size: "$members" }
          }
        },
        {
          $project: {
             name: 1,
             description: 1,
             coverImage: 1,
             memberCount: 1,
             createdBy: 1,
          }
        }
      ])
      .toArray();

    return NextResponse.json(groups);

  } catch (error) {
    console.error('Error fetching groups:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new group
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const { name, description } = await req.json();

    if (!name || !description) {
      return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const inviteCode = randomBytes(4).toString('hex').slice(0, 6);

    const newGroup = {
      name,
      description,
      createdBy: userId,
      members: [userId],
      coverImage: 'https://placehold.co/400x150/A7C4D3/000000',
      inviteCode,
      timestamp: new Date(),
    };

    const result = await db.collection('groups').insertOne(newGroup);

    return NextResponse.json({ message: 'Group created successfully', groupId: result.insertedId, inviteCode }, { status: 201 });

  } catch (error) {
    console.error('Error creating group:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
