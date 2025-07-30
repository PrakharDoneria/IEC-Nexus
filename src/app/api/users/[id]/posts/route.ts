
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorId = params.id;
    const client = await clientPromise;
    const db = client.db();

    const posts = await db.collection('posts')
      .aggregate([
        { $match: { authorId } },
        { $sort: { timestamp: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: 'id',
            as: 'authorInfo'
          }
        },
        {
          $unwind: {
            path: '$authorInfo',
            preserveNullAndEmptyArrays: true // Keep posts even if author is somehow deleted
          }
        },
        {
          $addFields: {
            "author.id": "$authorInfo.id",
            "author.name": "$authorInfo.name",
            "author.email": "$authorInfo.email",
            "author.avatar": "$authorInfo.avatar",
            "author.role": "$authorInfo.role"
          }
        },
        {
          $project: {
            authorInfo: 0 // Remove the temporary authorInfo field
          }
        }
      ])
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error(`Error fetching posts for user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
