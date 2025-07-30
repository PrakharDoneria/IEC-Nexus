
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Edit a group message
export async function PATCH(req: NextRequest, { params }: { params: { id: string, messageId: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!ObjectId.isValid(params.id) || !ObjectId.isValid(params.messageId)) {
      return NextResponse.json({ message: 'Invalid group or message ID' }, { status: 400 });
    }
    const groupId = new ObjectId(params.id);
    const messageId = new ObjectId(params.messageId);
    
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('groupMessages').updateOne(
      { _id: messageId, groupId, senderId: userId },
      { $set: { content, isEdited: true } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Message not found or you do not have permission to edit it' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message updated successfully' });

  } catch (error) {
    console.error('Error updating group message:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// Delete a group message
export async function DELETE(req: NextRequest, { params }: { params: { id: string, messageId: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!ObjectId.isValid(params.id) || !ObjectId.isValid(params.messageId)) {
      return NextResponse.json({ message: 'Invalid group or message ID' }, { status: 400 });
    }
    const groupId = new ObjectId(params.id);
    const messageId = new ObjectId(params.messageId);

    const client = await clientPromise;
    const db = client.db();

    const group = await db.collection('groups').findOne({ _id: groupId });
    if (!group) {
        return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }
    
    const message = await db.collection('groupMessages').findOne({ _id: messageId, groupId: groupId });
    if (!message) {
        return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    const currentUserMemberInfo = group.members.find((m: any) => m.userId === userId);
    const isOwnerOrModerator = currentUserMemberInfo && ['owner', 'moderator'].includes(currentUserMemberInfo.role);

    // Allow deletion if the user is the sender OR if the user is a moderator/owner
    if (message.senderId !== userId && !isOwnerOrModerator) {
         return NextResponse.json({ message: 'You do not have permission to delete this message' }, { status: 403 });
    }
    
    let deletionReason = "Deleted by sender.";
    if (isOwnerOrModerator && message.senderId !== userId) {
        const { reason } = await req.json();
        deletionReason = reason || "No reason provided.";
    }

    // Soft delete the message
    await db.collection('groupMessages').updateOne(
      { _id: messageId },
      { 
        $set: { 
            content: `This message was deleted by a moderator. Reason: ${deletionReason}`,
            isDeleted: true, 
            reactions: [] // Clear reactions
        },
        $unset: {
            isEdited: "" // Remove edited flag if it exists
        }
      }
    );

    return NextResponse.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Error deleting group message:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
