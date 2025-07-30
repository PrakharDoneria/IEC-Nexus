
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';

// Get all posts for the feed
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Implement pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const posts = await db.collection('posts')
      .aggregate([
        { $sort: { timestamp: -1 } },
        { $skip: skip },
        { $limit: limit },
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
      .toArray();
    
    const totalPosts = await db.collection('posts').countDocuments();

    return NextResponse.json({ posts, totalPages: Math.ceil(totalPosts / limit) });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// Create a new post
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    const authorId = decodedToken.uid;
    
    const { content, resourceLink } = await req.json();

    if (!content && !resourceLink) {
      return NextResponse.json({ message: 'Content or a resource link is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newPost = {
      authorId,
      content: content || "",
      resourceLink: resourceLink || null,
      timestamp: new Date(),
      likes: [],
      commentCount: 0,
    };

    await db.collection('posts').insertOne(newPost);

    // Re-fetch the post with author info to return
     const createdPost = await db.collection('posts').aggregate([
        { $match: { _id: newPost._id } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: 'id',
            as: 'authorInfo'
          }
        },
        { $unwind: '$authorInfo' },
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
      ]).next();


    return NextResponse.json(createdPost, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
