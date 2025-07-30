
import { z } from 'zod';
import { ObjectId } from "mongodb";

export type User = {
  _id?: ObjectId;
  id: string; // This will be the Firebase UID
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  role: 'Student' | 'Faculty';
  fcmToken?: string;
  following?: string[] | User[];
  followers?: string[] | User[];
  isBanned?: boolean;
  notificationSettings?: NotificationSettings;
  score?: number;
  bannerImage?: string;
};

export type Comment = {
  _id?: ObjectId;
  authorId: string;
  postId: ObjectId;
  content: string;
  timestamp: Date;
  author?: User; // Populated from the users collection
}

export type Post = {
  _id?: ObjectId;
  authorId: string;
  author: User;
  content: string;
  timestamp: string | Date;
  likes: string[]; // Array of user IDs who liked the post
  commentCount: number;
  resourceLink?: string;
};

export type GroupMember = {
    userId: string;
    role: 'owner' | 'moderator' | 'member';
}

export type Group = {
  _id?: ObjectId;
  name: string;
  description: string;
  coverImage: string;
  members: GroupMember[]; // Array of GroupMember objects
  createdBy: string; // User ID
  inviteCode: string;
  memberCount?: number; // This can be derived or stored
};

export type Reaction = {
  userId: string;
  emoji: string;
};

export type Message = {
    _id?: ObjectId;
    conversationId: ObjectId;
    senderId: string;
    content: string;
    imageUrl?: string; // For image messages
    timestamp: Date;
    readBy: string[]; // Array of user IDs who have read the message
    reactions?: Reaction[];
    isEdited?: boolean;
    sender?: User; // populated
};

export type GroupMessage = {
    _id?: ObjectId;
    groupId: ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
    reactions?: Reaction[];
    isEdited?: boolean;
    sender?: User; // populated
};

export type GroupAnnouncement = {
    _id?: ObjectId;
    groupId: ObjectId;
    authorId: string;
    content: string;
    timestamp: Date;
    author?: User; // populated
    imageUrl?: string;
    attachmentLink?: string;
};


export type Conversation = {
    _id?: ObjectId;
    participants: string[]; // array of user IDs
    lastMessage?: Message;
    participant: User; // populated
    unreadCount?: number; // populated for the current user
};


export type NotificationSettings = {
    newFollower: boolean;
    postLike: boolean;
    postComment: boolean;
    groupInvite: boolean;
    directMessage: boolean;
    groupAnnouncement: boolean;
    groupMessage: boolean; // Add this line
};

// Schemas for Coding Challenge
export const ValidateSolutionInputSchema = z.object({
  challengeTitle: z.string(),
  challengeDescription: z.string(),
  exampleInput: z.string(),
  exampleOutput: z.string(),
  userSolution: z.string().describe("The user's code solution, likely in Python or JavaScript."),
  userId: z.string().describe("The ID of the user submitting the solution."),
});
export type ValidateSolutionInput = z.infer<typeof ValidateSolutionInputSchema>;

export const ValidateSolutionOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s solution is correct.'),
  feedback: z.string().describe('Constructive feedback on the user\'s solution, explaining why it is correct or incorrect.'),
  pointsAwarded: z.number().describe('The number of points awarded for a correct solution.'),
  newScore: z.number().describe("The user's new total score after this submission."),
});
export type ValidateSolutionOutput = z.infer<typeof ValidateSolutionOutputSchema>;
