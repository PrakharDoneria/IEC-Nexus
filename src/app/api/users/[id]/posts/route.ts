
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorId = params.id;
    const client = await clientPromise;
    const db = client.db();

    const posts = await db.collection('posts')
      .find({ authorId })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error(`Error fetching posts for user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
