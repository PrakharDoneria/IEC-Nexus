
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessagesSquare, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

function ConversationList({ conversations, loading, onDeleteConversation }: { conversations: Conversation[], loading: boolean, onDeleteConversation: (convoId: string) => void }) {
    const { idToken } = useAuth();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (convoId: string) => {
        setDeletingId(convoId);
        try {
            if (!idToken) throw new Error("Authentication required");
            const res = await fetch(`/api/messages/${convoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete conversation');
            
            toast({ title: 'Conversation Deleted', description: 'The chat has been removed.' });
            onDeleteConversation(convoId);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setDeletingId(null);
        }
    }


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
                <h3 className="text-2xl font-bold">No Conversations</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    You haven't started any conversations yet. Find someone to chat with on their profile page.
                </p>
            </div>
        )
    }

    return (
        <nav className="divide-y">
           {conversations.map(convo => {
               if (!convo.participant || !convo._id) return null; // Skip convos without participant data

               const isUnread = (convo.unreadCount || 0) > 0;

               return (
                <div key={convo._id.toString()} className="flex items-center gap-1 p-3 hover:bg-secondary group">
                    <Link href={`/messages/${convo._id.toString()}`} className="w-full flex items-center gap-3 text-left">
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

                    <AlertDialog>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Chat</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete your entire conversation with <strong>{convo.participant.name}</strong>. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(convo._id!.toString())} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deletingId === convo._id.toString()}>
                                    {deletingId === convo._id.toString() && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
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
    const { fetchUnreadCount } = useUnreadCount();

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

    const handleDeleteConversation = (convoId: string) => {
        setConversations(prev => prev.filter(c => c._id!.toString() !== convoId));
    };


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
                 <header className="hidden md:flex h-16 items-center border-b bg-card px-4 md:px-6">
                    <h1 className="text-2xl font-bold">Messages</h1>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <ConversationList conversations={conversations} loading={loadingConvos} onDeleteConversation={handleDeleteConversation} />
                </main>
            </div>
        </div>
    );
}
