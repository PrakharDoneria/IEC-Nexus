
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { User } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(req.url);
    const populate = searchParams.get('populate');


    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ id: userId });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // If populate parameter is present, fetch follower/following details
    if (populate) {
        if(populate.includes('followers') && user.followers?.length > 0) {
            user.followers = await db.collection<User>('users').find({ id: { $in: user.followers } }).toArray();
        }
        if(populate.includes('following') && user.following?.length > 0) {
            user.following = await db.collection<User>('users').find({ id: { $in: user.following } }).toArray();
        }
    }


    // Ensure score is a number, default to 0 if not present
    const userWithScore = {
        ...user,
        score: user.score || 0,
    };

    const { _id, ...userWithoutMongoId } = userWithScore;

    return NextResponse.json(userWithoutMongoId);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
