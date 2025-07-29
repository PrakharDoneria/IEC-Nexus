
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "firebase-admin/auth";
import admin from '@/lib/firebase-admin';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role: requestedRole } = await req.json();

    if (!name || !email || !password || !requestedRole) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const auth = getAuth(admin.app());

    // Determine role based on email, overriding user selection if it's a faculty email
    let finalRole = requestedRole;
    if (email.endsWith('@ieccollege.com')) {
      finalRole = 'Faculty';
    } else if (finalRole === 'Faculty') {
        return NextResponse.json({ message: 'You must use an @ieccollege.com email to register as faculty.' }, { status: 403 });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false, // User must verify their email
    });

    // Set custom claim for role
    await auth.setCustomUserClaims(userRecord.uid, { role: finalRole });

    // Save user to MongoDB
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const newUser = {
      id: userRecord.uid,
      name,
      email,
      role: finalRole,
      bio: "At IEC",
      avatar: `https://placehold.co/100x100/A7C4D3/000000?text=${name.charAt(0)}`,
      following: [],
      followers: [],
    };

    await usersCollection.insertOne(newUser);
    
    // We don't send a verification email from the server.
    // The client should handle this after a successful signup response.

    return NextResponse.json({ message: 'User created successfully. Please verify your email.', userId: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error("Signup error:", error);
    let message = 'An internal server error occurred.';
    if (error.code === 'auth/email-already-exists') {
        message = 'This email address is already in use.';
    } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
    }
    return NextResponse.json({ message }, { status: 400 });
  }
}
