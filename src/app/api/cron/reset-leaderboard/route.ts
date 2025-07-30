
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { User } from '@/lib/types';
import { sendNotification } from '@/services/notifications';

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (authToken !== process.env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<User>('users');

    // 1. Find the winner
    const winner = await usersCollection.findOne(
      { isBanned: { $ne: true } },
      { sort: { score: -1 } }
    );
    
    // 2. Announce the winner via push notification to all users
    if (winner && (winner.score || 0) > 0) {
        const allUsersWithToken = await usersCollection.find({ fcmToken: { $exists: true, $ne: null } }).toArray();

        const notificationTitle = `🏆 Leaderboard Winner of the Week!`;
        const notificationBody = `Congratulations to ${winner.name} for winning this week's challenge with ${winner.score} points!`;
        const notificationLink = `/profile/${winner.id}`;
        
        for (const user of allUsersWithToken) {
            // We can reuse the sendNotification function, it will check individual user preferences
            await sendNotification(user.id, notificationTitle, notificationBody, notificationLink, 'groupAnnouncement'); // Using 'groupAnnouncement' category for now, can be a new one
        }
    }

    // 3. Reset scores for all users
    await usersCollection.updateMany({}, { $set: { score: 0 } });

    return NextResponse.json({ message: 'Leaderboard reset successfully.' });

  } catch (error) {
    console.error('Error in leaderboard reset cron job:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
