
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
          $project: {
            content: 1,
            timestamp: 1,
            likes: 1,
            comments: 1,
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
