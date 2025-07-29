
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    const postId = new ObjectId(params.id);

    const client = await clientPromise;
    const db = client.db();
    const postsCollection = db.collection('posts');

    const post = await postsCollection.findOne({ _id: postId });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const likes = post.likes || [];
    const hasLiked = likes.includes(userId);
    let update;

    if (hasLiked) {
      // User has liked, so unlike
      update = { $pull: { likes: userId } };
    } else {
      // User has not liked, so like
      update = { $addToSet: { likes: userId } }; // use $addToSet to prevent duplicate likes
    }

    const result = await postsCollection.updateOne({ _id: postId }, update);
    
    const updatedPost = await postsCollection.findOne({ _id: postId });

    return NextResponse.json({
        likes: updatedPost?.likes || [],
        isLiked: !hasLiked
    });

  } catch (error: any) {
    console.error('Error liking post:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
