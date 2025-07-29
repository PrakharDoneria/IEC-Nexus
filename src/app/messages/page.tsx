
"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NeoButton } from "@/components/NeoButton";
import { Conversation, Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Send, MessagesSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const mockConversations: Conversation[] = [
    {
        id: 'convo1',
        participant: { id: 'user2', name: 'Jane Doe', role: 'Student', email: 'jane@example.com', avatar: 'https://placehold.co/100x100/D3A7C4/000000?text=JD', followers:[], following:[] },
        lastMessage: { id: 'msg1', sender: { id: 'user2', name: 'Jane Doe', role: 'Student', email: 'jane@example.com', avatar: 'https://placehold.co/100x100/D3A7C4/000000?text=JD', followers:[], following:[] }, content: 'Hey, did you finish the assignment?', timestamp: '10m' }
    },
    {
        id: 'convo2',
        participant: { id: 'user3', name: 'Prof. Smith', role: 'Faculty', email: 'prof@ieccollege.com', avatar: 'https://placehold.co/100x100/C4D3A7/000000?text=PS', followers:[], following:[] },
        lastMessage: { id: 'msg2', sender: { id: 'user1', name: 'John Doe', role: 'Student', email: 'john@example.com', avatar: 'https://placehold.co/100x100/A7C4D3/000000?text=JD', followers:[], following:[] }, content: 'Yes, I had a question about part 2.', timestamp: '1h' }
    },
];

const initialMockMessages: Record<string, Message[]> = {
    'convo1': [
        { id: 'msg1', sender: { id: 'user2', name: 'Jane Doe', role: 'Student', email: 'jane@example.com', avatar: 'https://placehold.co/100x100/D3A7C4/000000?text=JD', followers:[], following:[] }, content: 'Hey, did you finish the assignment?', timestamp: '10m ago' },
        { id: 'msg3', sender: { id: 'user1', name: 'John Doe', role: 'Student', email: 'john@example.com', avatar: 'https://placehold.co/100x100/A7C4D3/000000?text=JD', followers:[], following:[] }, content: 'Almost! Just stuck on the last question.', timestamp: '8m ago' },
    ]
};


function ConversationList() {
    return (
        <div className="border-r-2 border-foreground h-full flex flex-col">
            <div className="p-4 border-b-2 border-foreground">
                <h2 className="font-headline text-2xl font-bold">Messages</h2>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-10 border-2 border-foreground" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="grid gap-px">
                   <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
                </nav>
            </div>
        </div>
    )
}

function MessageView() {
    const { user } = useAuth();
    
    if (!user) return null;

    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-8">
            <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-headline text-2xl font-bold">Direct Messaging</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
                The direct messaging feature is under construction. Soon you'll be able to chat with other students and faculty right here.
            </p>
        </div>
    )
}


export default function MessagesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] md:h-[calc(100vh-65px)]">
           <ConversationList />
           <MessageView />
        </main>
      </div>
    </div>
  );
}
