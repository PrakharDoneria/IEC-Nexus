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
};

export type Post = {
  _id?: ObjectId | string;
  authorId: string;
  author: User;
  content: string;
  timestamp: string | Date;
  likes: number;
  comments: number;
  resourceLink?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  coverImage: string;
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
