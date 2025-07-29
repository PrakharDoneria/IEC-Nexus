
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { sendNotification } from '@/services/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userName = decodedToken.name || 'Someone';

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
    let isLikedNow = false;

    if (hasLiked) {
      // User has liked, so unlike
      update = { $pull: { likes: userId } };
      isLikedNow = false;
    } else {
      // User has not liked, so like
      update = { $addToSet: { likes: userId } }; // use $addToSet to prevent duplicate likes
      isLikedNow = true;
    }

    await postsCollection.updateOne({ _id: postId }, update);
    
    // Send notification if a user (not the author) likes the post
    if (isLikedNow && post.authorId !== userId) {
        const notificationTitle = `${userName} liked your post`;
        const notificationBody = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
        const notificationLink = `/posts/${post._id}`;
        await sendNotification(post.authorId, notificationTitle, notificationBody, notificationLink, 'postLike');
    }
    
    const updatedPost = await postsCollection.findOne({ _id: postId });

    return NextResponse.json({
        likes: updatedPost?.likes || [],
        isLiked: isLikedNow
    });

  } catch (error: any) {
    console.error('Error liking post:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
