
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessagesSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { Badge } from "@/components/ui/badge";

function formatTimestamp(timestamp: Date | string) {
    const date = new Date(timestamp);
    if (isToday(date)) {
        return format(date, 'p'); // e.g., 4:30 PM
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }
    return format(date, 'P'); // e.g., 04/10/2024
}

function ConversationList({ conversations, loading, currentUserId }: { conversations: Conversation[], loading: boolean, currentUserId?: string | null }) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }
    
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-headline text-2xl font-bold">No Conversations</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    You haven't started any conversations yet. Find someone to chat with on their profile page.
                </p>
            </div>
        )
    }

    return (
        <nav className="divide-y-2 divide-border">
           {conversations.map(convo => {
               if (!convo.participant) return null; // Skip convos without participant data

               const isUnread = (convo.unreadCount || 0) > 0;

               return (
                 <Link key={convo._id?.toString()} href={`/messages/${convo._id!.toString()}`} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary">
                     <Avatar>
                         <AvatarImage src={convo.participant?.avatar} />
                         <AvatarFallback>{convo.participant?.name.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 overflow-hidden">
                         <div className="flex justify-between items-baseline">
                           <p className={cn("truncate", isUnread ? "font-bold" : "font-semibold")}>{convo.participant?.name}</p>
                           {convo.lastMessage?.timestamp && <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(convo.lastMessage.timestamp)}</span>}
                         </div>
                         <p className={cn("text-sm truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>{convo.lastMessage?.content || '...'}</p>
                     </div>
                     {isUnread && <Badge variant="destructive" className="h-5">{convo.unreadCount}</Badge>}
                 </Link>
               )
            })}
        </nav>
    )
}


export default function MessagesPage() {
    const { user, idToken, authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const { conversations: unreadConversations, fetchUnreadCount } = useUnreadCount();

    const isFetchingConvos = useRef(false);

    const fetchConversations = useCallback(async () => {
        if (!idToken || isFetchingConvos.current) return;
        isFetchingConvos.current = true;
        setLoadingConvos(true);

        try {
            const res = await fetch('/api/messages', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error('Failed to fetch conversations');
            const data = await res.json();
            setConversations(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load conversations.' });
        } finally {
            setLoadingConvos(false);
            isFetchingConvos.current = false;
        }
    }, [idToken]);

    useEffect(() => {
        const recipientId = searchParams.get('recipient');

        const handleStartConversation = async () => {
             if (recipientId && idToken && user && recipientId !== user.id) {
                setLoadingConvos(true);
                try {
                    const res = await fetch('/api/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                             'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ recipientId })
                    });
                     if (!res.ok) throw new Error('Failed to start conversation');
                    const data = await res.json();
                    router.replace(`/messages/${data.conversationId}`); // Go to the chat page
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Error', description: 'Could not start conversation.' });
                     fetchConversations();
                } 
            }
        };

        if(!authLoading && idToken) {
            if (recipientId) {
                handleStartConversation();
            } else {
                fetchConversations();
            }
            fetchUnreadCount();
        }

    }, [searchParams, idToken, user, authLoading, router, fetchUnreadCount, fetchConversations]);

    if (authLoading || loadingConvos) {
        return (
             <div className="flex min-h-screen bg-background">
                <AppSidebar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col pb-16 md:pb-0">
                <MobileNav pageTitle="Messages" />
                 <header className="hidden md:flex h-16 items-center border-b-2 bg-card px-4 md:px-6">
                    <h1 className="text-2xl font-headline font-bold">Messages</h1>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <ConversationList conversations={conversations} loading={loadingConvos} currentUserId={user?.id} />
                </main>
            </div>
        </div>
    );
}
