
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

export type Group = {
  _id?: ObjectId;
  name: string;
  description: string;
  coverImage: string;
  members: string[]; // Array of user IDs
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
}
