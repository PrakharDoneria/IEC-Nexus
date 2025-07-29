export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Faculty';
};

export type Post = {
  id: string;
  author: User;
  content: string;
  timestamp: string;
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
}

export type Conversation = {
    id: string;
    participant: User;
    lastMessage: Message;
}
