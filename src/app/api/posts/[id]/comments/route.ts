
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';
import admin from '@/lib/firebase-admin';
import { sendNotification } from '@/services/notifications';

// Get comments for a post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
        return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    const postId = new ObjectId(params.id);
    const client = await clientPromise;
    const db = client.db();

    const comments = await db.collection('comments')
        .aggregate([
            { $match: { postId: postId } },
            { $sort: { timestamp: 1 } },
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
                    _id: 1,
                    content: 1,
                    timestamp: 1,
                    author: {
                        id: '$authorInfo.id',
                        name: '$authorInfo.name',
                        avatar: '$authorInfo.avatar',
                        role: '$authorInfo.role',
                    }
                }
            }
        ])
        .toArray();

    return NextResponse.json(comments);

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Add a comment to a post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const idToken = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
        const authorId = decodedToken.uid;
        const authorName = decodedToken.name || 'A user';

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
        }
        const postId = new ObjectId(params.id);

        const { content } = await req.json();
        if (!content) {
            return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const post = await db.collection('posts').findOne({ _id: postId });
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        const newComment = {
            postId,
            authorId,
            content,
            timestamp: new Date(),
        };

        const result = await db.collection('comments').insertOne(newComment);
        
        // Atomically increment comment count on the post
        await db.collection('posts').updateOne(
            { _id: postId },
            { $inc: { commentCount: 1 } }
        );
        
        // Send notification if someone else commented
        if (post.authorId !== authorId) {
             const notificationTitle = `${authorName} commented on your post`;
             const notificationBody = content.substring(0, 100) + (content.length > 100 ? '...' : '');
             const notificationLink = `/posts/${post._id}`;
             await sendNotification(post.authorId, notificationTitle, notificationBody, notificationLink, 'postComment');
        }

        // Fetch the created comment with author info to return it
        const createdComment = await db.collection('comments').aggregate([
            { $match: { _id: result.insertedId } },
            { $lookup: { from: 'users', localField: 'authorId', foreignField: 'id', as: 'authorInfo' } },
            { $unwind: '$authorInfo' },
            { $project: {
                _id: 1,
                content: 1,
                timestamp: 1,
                author: { id: '$authorInfo.id', name: '$authorInfo.name', avatar: '$authorInfo.avatar', role: '$authorInfo.role' }
            }}
        ]).next();

        return NextResponse.json(createdComment, { status: 201 });

    } catch (error) {
        console.error('Error creating comment:', error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
