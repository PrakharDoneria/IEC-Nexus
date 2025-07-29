
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NeoButton } from "@/components/NeoButton";
import { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Send, MessagesSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";


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


function ConversationList({ conversations, onSelect, activeConvoId, loading }: { conversations: Conversation[], onSelect: (id: string) => void, activeConvoId: string | null, loading: boolean }) {
    if (loading) {
        return (
            <div className="border-r-2 border-foreground h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }
    
    return (
        <div className="border-r-2 border-foreground h-full flex flex-col">
            <div className="p-4 border-b-2 border-foreground">
                <h2 className="font-headline text-2xl font-bold">Messages</h2>
                 {/* Search could be implemented in the future */}
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="divide-y-2 divide-foreground">
                   {conversations.length === 0 ? (
                       <p className="p-4 text-sm text-muted-foreground">No conversations yet. Start one from a user's profile.</p>
                   ) : (
                       conversations.map(convo => (
                           <button key={convo._id?.toString()} onClick={() => onSelect(convo._id!.toString())} className={cn("w-full flex items-center gap-3 p-3 text-left hover:bg-secondary", activeConvoId === convo._id?.toString() && 'bg-secondary')}>
                               <Avatar>
                                   <AvatarImage src={convo.participant?.avatar} />
                                   <AvatarFallback>{convo.participant?.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1 overflow-hidden">
                                   <div className="flex justify-between items-baseline">
                                     <p className="font-semibold truncate">{convo.participant?.name}</p>
                                     {convo.lastMessage?.timestamp && <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(convo.lastMessage.timestamp)}</span>}
                                   </div>
                                   <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.content}</p>
                               </div>
                           </button>
                       ))
                   )}
                </nav>
            </div>
        </div>
    )
}

function MessageView({ conversationId, onMessageSent }: { conversationId: string | null, onMessageSent: () => void }) {
    const { user, idToken } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

     const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/messages/${conversationId}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to load messages");
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.'});
        } finally {
            setLoading(false);
        }
    }, [conversationId, idToken]);


    useEffect(() => {
        if (conversationId) {
            fetchMessages();

            // Poll for new messages every 5 seconds
            const intervalId = setInterval(fetchMessages, 5000);

            return () => clearInterval(intervalId);
        }
    }, [conversationId, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        setSending(true);
        try {
            const res = await fetch(`/api/messages/${conversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newMessage })
            });
            if (!res.ok) throw new Error("Failed to send message");
            const sentMessage = await res.json();
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage("");
            onMessageSent(); // To refresh conversation list
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.'});
        } finally {
            setSending(false);
        }
    }

    if (!conversationId) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-8">
                <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-headline text-2xl font-bold">Select a Conversation</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Choose a conversation from the list on the left to start chatting.
                </p>
            </div>
        )
    }

     if (loading && messages.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-secondary">
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                  <div key={msg._id?.toString()} className={cn("flex items-end gap-2", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
                      {msg.senderId !== user?.id && (
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar} />
                              <AvatarFallback>{msg.sender?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                      )}
                      <div className={cn(
                          "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl border-2 border-foreground", 
                          msg.senderId === user?.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card rounded-bl-none"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                  </div>
              ))}
              <div ref={messagesEndRef} />
           </div>
           <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-foreground bg-card">
               <div className="flex gap-2">
                   <Input 
                        placeholder="Type a message..." 
                        className="border-2 border-foreground"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                    />
                   <NeoButton type="submit" size="icon" disabled={sending}>
                       {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                   </NeoButton>
               </div>
           </form>
        </div>
    )
}


export default function MessagesPage() {
    const { user, idToken, authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [loadingConvos, setLoadingConvos] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!idToken) return;
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
        }
    }, [idToken]);

    useEffect(() => {
        const recipientId = searchParams.get('recipient');

        const startOrSelectConversation = async () => {
            if (recipientId && idToken && user && recipientId !== user.id) {
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
                    setActiveConvoId(data.conversationId);
                    await fetchConversations();
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Error', description: 'Could not start conversation.' });
                }
            } else {
                 fetchConversations();
            }
        };

        if(!authLoading) {
            startOrSelectConversation();
        }

    }, [searchParams, idToken, fetchConversations, authLoading, user]);

    if (authLoading) {
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
            <div className="flex-1 flex flex-col">
                <MobileNav />
                <main className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] h-[calc(100vh-64px)]">
                    <ConversationList conversations={conversations} onSelect={setActiveConvoId} activeConvoId={activeConvoId} loading={loadingConvos} />
                    <MessageView conversationId={activeConvoId} onMessageSent={fetchConversations} />
                </main>
            </div>
        </div>
    );
}

    