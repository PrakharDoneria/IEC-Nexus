import type { User, Post, Group, Message, Conversation } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Alia Sharma', email: 'alia.s@example.com', avatar: 'https://placehold.co/100x100/A7C4D3/000000', role: 'Student' },
  { id: '2', name: 'Prof. Rajan Singh', email: 'rajan.s@ieccollege.com', avatar: 'https://placehold.co/100x100/748DA6/FFFFFF', role: 'Faculty' },
  { id: '3', name: 'Karan Verma', email: 'karan.v@example.com', avatar: 'https://placehold.co/100x100/A7C4D3/000000', role: 'Student' },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: mockUsers[1],
    content: "Reminder: The submission deadline for the Advanced Algorithms assignment is this Friday. Please make sure to submit your work on the portal. I've shared a resource on Dijkstra's algorithm that might be helpful.",
    timestamp: '2 hours ago',
    likes: 15,
    comments: 4,
    resourceLink: 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/'
  },
  {
    id: 'p2',
    author: mockUsers[0],
    content: "Has anyone started working on the compiler design project? I'm looking for a group to join. I'm pretty good with front-end parsing techniques!",
    timestamp: '5 hours ago',
    likes: 8,
    comments: 12,
  },
  {
    id: 'p3',
    author: mockUsers[2],
    content: "Just found this amazing collection of machine learning research papers. A must-read for anyone interested in AI. #ML #AI",
    timestamp: '1 day ago',
    likes: 22,
    comments: 6,
    resourceLink: 'https://paperswithcode.com/sota'
  },
];

export const mockGroups: Group[] = [
    { id: 'g1', name: 'AI & Machine Learning Club', description: 'Discussions on AI, ML, and data science.', memberCount: 42, coverImage: 'https://placehold.co/600x400' },
    { id: 'g2', name: 'Competitive Programming', description: 'Practice and discuss competitive coding problems.', memberCount: 78, coverImage: 'https://placehold.co/600x400' },
    { id: 'g3', name: 'Final Year Project Group 7', description: 'Collaboration space for FYP Group 7.', memberCount: 4, coverImage: 'https://placehold.co/600x400' },
];

const messages: Message[] = [
    { id: 'm1', sender: mockUsers[0], content: 'Hey Prof. Singh, I had a question about the lecture today.', timestamp: '10:30 AM'},
    { id: 'm2', sender: mockUsers[1], content: 'Of course, Alia. What would you like to know?', timestamp: '10:31 AM'},
    { id: 'm3', sender: mockUsers[0], content: "I was a bit confused about the Red-Black Tree insertion logic. Could you maybe point me to some good resources?", timestamp: '10:32 AM'},
]

export const mockConversations: Conversation[] = [
    { id: 'c1', participant: mockUsers[1], lastMessage: messages[2] },
    { id: 'c2', participant: mockUsers[2], lastMessage: { id: 'm4', sender: mockUsers[2], content: 'See you at the library.', timestamp: 'Yesterday' } },
];

export const mockMessages: Record<string, Message[]> = {
    'c1': messages,
    'c2': [
        { id: 'm5', sender: mockUsers[2], content: 'Hey, are you going to the tech fest?', timestamp: 'Yesterday' },
        { id: 'm4', sender: mockUsers[2], content: 'See you at the library.', timestamp: 'Yesterday' }
    ]
}
