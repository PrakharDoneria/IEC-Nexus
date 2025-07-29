
import { ObjectId } from "mongodb";

export type User = {
  _id?: ObjectId;
  id: string; // This will be the Firebase UID
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Faculty';
  fcmToken?: string;
  following?: string[];
  followers?: string[];
  isBanned?: boolean;
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

export type Message = {
    id: string;
    sender: User;
    content: string;
    timestamp: string;
};

export type Conversation = {
    id: string;
    participant: User;
    lastMessage: Message;
};


export type NotificationSettings = {
    newFollower: boolean;
    postLike: boolean;
    postComment: boolean;
    groupInvite: boolean;
    directMessage: boolean;
}
