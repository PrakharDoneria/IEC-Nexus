
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const users = await db.collection('users')
      .find(
        { isBanned: { $ne: true } }, // Exclude banned users
        { 
            projection: { 
                _id: 0, 
                id: 1, 
                name: 1, 
                avatar: 1, 
                role: 1,
                score: 1 
            } 
        }
      )
      .sort({ score: -1 }) // Sort by score descending
      .limit(50) // Limit to top 50 users
      .toArray();

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
