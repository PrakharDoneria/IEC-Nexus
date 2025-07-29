
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
        return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    const postId = new ObjectId(params.id);
    const client = await clientPromise;
    const db = client.db();

    const post = await db.collection('posts')
      .aggregate([
        { $match: { _id: postId } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: 'id',
            as: 'authorInfo'
          }
        },
        {
          $unwind: '$authorInfo'
        },
        {
          $addFields: {
            commentCount: { $ifNull: ["$commentCount", 0] },
          }
        },
        {
          $project: {
            content: 1,
            timestamp: 1,
            likes: 1,
            commentCount: 1,
            resourceLink: 1,
            authorId: 1,
            author: {
              id: '$authorInfo.id',
              name: '$authorInfo.name',
              email: '$authorInfo.email',
              avatar: '$authorInfo.avatar',
              role: '$authorInfo.role',
            }
          }
        }
      ])
      .next();

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    
    // Only faculty can delete posts
    if (decodedToken.role !== 'Faculty') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    const postId = new ObjectId(params.id);

    const client = await clientPromise;
    const db = client.db();
    
    // Delete associated comments first
    await db.collection('comments').deleteMany({ postId: postId });

    // Delete the post
    const result = await db.collection('posts').deleteOne({ _id: postId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting post:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
