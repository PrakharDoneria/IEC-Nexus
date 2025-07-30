
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';
import { User } from '@/lib/types';
import cloudinary from '@/lib/cloudinary';


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

    if (!group.members.some((m: any) => m.userId === userId)) {
         return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Populate member details
    const memberUserIds = group.members.map((m: any) => m.userId);
    const memberUsers = await db.collection<User>('users').find(
        { id: { $in: memberUserIds } },
        { projection: { name: 1, avatar: 1, role: 1, id: 1, email: 1 } }
    ).toArray();

    const userMap = new Map(memberUsers.map(u => [u.id, u]));

    group.members = group.members.map((m: any) => ({
      ...m,
      ...userMap.get(m.userId)
    }));


    return NextResponse.json(group, { status: 200 });

  } catch (error) {
    console.error('Error fetching group details:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
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

        const { name, description, coverImage } = await req.json();
        
        const updateData: { name?: string, description?: string, coverImage?: string } = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        if (coverImage && coverImage.startsWith('data:image')) {
             try {
                const uploadResponse = await cloudinary.uploader.upload(coverImage, {
                    folder: 'iec-nexus-groups',
                    resource_type: 'image',
                });
                updateData.coverImage = uploadResponse.secure_url;
            } catch (error) {
                console.error('Cloudinary upload failed:', error);
                return NextResponse.json({ message: 'Image upload failed.' }, { status: 500 });
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('groups').updateOne(
            { _id: groupId, createdBy: userId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: 'Group not found or you do not have permission to edit it' }, { status: 404 });
        }

        const updatedGroup = await db.collection('groups').findOne({ _id: groupId });

        return NextResponse.json({ message: 'Group updated successfully', group: updatedGroup }, { status: 200 });

    } catch (error) {
        console.error('Error updating group:', error);
        if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// Delete a group (owner only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

        if (group.createdBy !== userId) {
            return NextResponse.json({ message: 'Only the group owner can delete the group' }, { status: 403 });
        }

        // Perform deletion
        // 1. Delete group messages
        await db.collection('groupMessages').deleteMany({ groupId: groupId });
        // 2. Delete group announcements
        await db.collection('groupAnnouncements').deleteMany({ groupId: groupId });
        // 3. Delete the group itself
        await db.collection('groups').deleteOne({ _id: groupId });

        return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error deleting group:', error);
        if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
