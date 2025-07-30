
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { ObjectId } from 'mongodb';

// Add or remove a reaction to a group message
export async function POST(req: NextRequest, { params }: { params: { id: string, messageId: string } }) {
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
    
    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ message: 'Emoji is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const messagesCollection = db.collection('groupMessages');

    // Verify user is in the group
    const group = await db.collection('groups').findOne({ _id: groupId, members: userId });
    if (!group) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const message = await messagesCollection.findOne({ _id: messageId, groupId });
    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    const existingReactionIndex = (message.reactions || []).findIndex(
      (r: any) => r.userId === userId && r.emoji === emoji
    );

    let updatedReactions;
    if (existingReactionIndex > -1) {
      // User is removing an existing reaction
      updatedReactions = message.reactions.filter((_: any, index: number) => index !== existingReactionIndex);
    } else {
      // User is adding a new reaction
      const newReaction = { userId, emoji };
      updatedReactions = [...(message.reactions || []), newReaction];
    }
    
    await messagesCollection.updateOne(
      { _id: messageId },
      { $set: { reactions: updatedReactions } }
    );
    
    const updatedMessage = await messagesCollection.findOne({ _id: messageId });

    return NextResponse.json({ reactions: updatedMessage?.reactions || [] });

  } catch (error) {
    console.error('Error reacting to group message:', error);
    if (error instanceof Error && (error.message.includes('auth/id-token-expired') || error.message.includes('auth/argument-error'))) {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
