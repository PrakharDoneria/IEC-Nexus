
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

    const result = await db.collection('groupMessages').deleteOne({ _id: messageId, groupId, senderId: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Message not found or you do not have permission to delete it' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Error deleting group message:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
