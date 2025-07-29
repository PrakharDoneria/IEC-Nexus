
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Search for users by name (case-insensitive)
    const users = await db.collection('users').find(
      { name: { $regex: query, $options: 'i' } },
      { projection: { _id: 0, name: 1, email: 1, avatar: 1, id: 1, role: 1 } }
    ).toArray();

    // In the future, you could also search posts and groups here.

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
