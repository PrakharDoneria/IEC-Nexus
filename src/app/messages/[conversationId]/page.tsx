'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Send, ArrowLeft, ImagePlus, X, ThumbsUp, Trash2, Pencil, Smile, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRealtime } from "@/hooks/useRealtime";

const MAX_IMAGE_SIZE_MB = 5;


function MessageActions({ message, onAction }: { message: Message, onAction: (action: 'edit' | 'delete' | 'react') => void }) {
    const { user } = useAuth();
    const canPerformAction = message.senderId === user?.id;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onAction('react')}>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    <span>React</span>
                </DropdownMenuItem>
                 {canPerformAction && (
                    <>
                        <DropdownMenuItem onClick={() => onAction('edit')}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete your message.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onAction('delete')}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export default function ChatPage() {
    const { user, idToken, authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;
    const { fetchUnreadCount } = useUnreadCount();
    const { addListener } = useRealtime();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [participant, setParticipant] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isFetching = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMessages = useCallback(async (cursor?: string | null) => {
        if (!idToken) return;
        if (isFetching.current && !cursor) return; // Allow loading more even if a fetch is in progress
        isFetching.current = true;
        
        if (cursor) {
            setLoadingMore(true);
        } else if (!messages.length) { 
            setLoading(true);
        }
        
        try {
            const url = cursor ? `/api/messages/${conversationId}?cursor=${cursor}` : `/api/messages/${conversationId}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to load messages");
            const data = await res.json();
            
            const prevScrollHeight = chatContainerRef.current?.scrollHeight;

            setMessages(prev => cursor ? [...data.messages, ...prev] : data.messages);
            if (!participant) setParticipant(data.participant);
            setNextCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
            
            if (!cursor) {
                fetchUnreadCount(); 
            }
            
            // Smart scroll positioning
            if (cursor && chatContainerRef.current && prevScrollHeight) {
                // Keep scroll position stable when loading older messages
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - prevScrollHeight;
            } else if (!cursor) {
                // Scroll to bottom on initial load or when a new message is sent/received
                 setTimeout(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                 }, 100);
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.'});
            if (!cursor) router.push('/messages');
        } finally {
            if (!cursor) setLoading(false);
            setLoadingMore(false);
            isFetching.current = false;
        }
    }, [conversationId, idToken, router, fetchUnreadCount, participant, messages.length]);


    // Real-time listener setup
    useEffect(() => {
        if (!conversationId) return;
        const intervalId = setInterval(() => fetchMessages(undefined), 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, [conversationId, fetchMessages]);


    // Initial fetch
    useEffect(() => {
        if (conversationId && idToken) {
            fetchMessages(); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, idToken]);


    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: "Image Too Large",
                    description: `Please select an image smaller than ${MAX_IMAGE_SIZE_MB}MB.`
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageData(reader.result as string);
                setImagePreview(URL.createObjectURL(file));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageData) || !conversationId) return;

        setSending(true);

        if (editingMessage) {
            try {
                const res = await fetch(`/api/messages/${conversationId}/${editingMessage._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ content: newMessage })
                });
                 if (!res.ok) throw new Error("Failed to edit message");
                 await fetchMessages();
                 toast({ title: "Message Edited" });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not edit message.'});
            } finally {
                setEditingMessage(null);
                setNewMessage("");
                setSending(false);
            }
            return;
        }

        try {
            const res = await fetch(`/api/messages/${conversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newMessage, imageUrl: imageData })
            });
            if (!res.ok) throw new Error("Failed to send message");
            setNewMessage("");
            setImageData(null);
            setImagePreview(null);
            await fetchMessages();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.'});
        } finally {
            setSending(false);
        }
    }

    const handleMessageAction = async (message: Message, action: 'edit' | 'delete' | 'react') => {
        if (!idToken || !user) return;

        if (action === 'edit') {
            if (message.senderId !== user?.id) return;
            setEditingMessage(message);
            setNewMessage(message.content);
        } else if (action === 'delete') {
            if (message.senderId !== user?.id) return;
            try {
                const res = await fetch(`/api/messages/${conversationId}/${message._id}`, {
                    method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!res.ok) throw new Error("Failed to delete message");
                await fetchMessages();
                toast({ title: "Message Deleted" });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not delete message.'});
            }
        } else if (action === 'react') {
            const emoji = '👍'; // Hardcoding a thumbs up for now
             try {
                const res = await fetch(`/api/messages/${conversationId}/${message._id}/react`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ emoji })
                });
                 if (!res.ok) throw new Error("Failed to react to message");
                const data = await res.json();
                 setMessages(prev => prev.map(m => m._id === message._id ? {...m, reactions: data.reactions} : m));
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not react to message.'});
            }
        }
    }


     if (authLoading || loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <AppSidebar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin" />
                </div>
            </div>
        )
    }

    if (!participant) {
        return null; // or some error state
    }

    return (
       <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col h-screen">
                <MobileNav pageTitle={participant.name} />
                <header className="hidden md:flex h-16 shrink-0 items-center border-b bg-card px-4 md:px-6">
                    <Link href={`/profile/${participant.id}`} className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.role}</p>
                        </div>
                    </Link>
                </header>

                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-secondary/50 pb-24 md:pb-4">
                    <div className="text-center">
                        {loadingMore ? (
                             <Loader2 className="h-6 w-6 animate-spin mx-auto my-2" />
                        ) : hasMore ? (
                             <Button variant="secondary" size="sm" onClick={() => fetchMessages(nextCursor)}>Load More</Button>
                        ) : (
                            <p className="text-xs text-muted-foreground my-2">Beginning of conversation</p>
                        )}
                    </div>
                    {messages.map((msg, index) => {
                        const isOwnMessage = msg.senderId === user?.id;
                        return (
                            <div key={msg._id?.toString() || index} className={cn("flex items-end gap-2 group", isOwnMessage ? "justify-end" : "justify-start")}>
                                {isOwnMessage && <div className="opacity-0 group-hover:opacity-100 transition-opacity"><MessageActions message={msg} onAction={(action) => handleMessageAction(msg, action)}/></div>}
                                {!isOwnMessage && (
                                    <Avatar className="h-8 w-8 self-start">
                                        <AvatarImage src={msg.sender?.avatar} />
                                        <AvatarFallback>{msg.sender?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-xl relative", 
                                    isOwnMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card rounded-bl-none"
                                )}>
                                    {msg.imageUrl && (
                                        <Image src={msg.imageUrl} alt="Chat image" width={300} height={300} className="rounded-lg object-cover" />
                                    )}
                                    {msg.content && <p className="p-2 whitespace-pre-wrap">{msg.content}</p>}
                                    {msg.isEdited && <p className="text-xs px-2 pb-1 opacity-70">(edited)</p>}
                                    {(msg.reactions?.length || 0) > 0 && (
                                        <div className="absolute -bottom-3 -right-1 bg-secondary border rounded-full px-1.5 py-0.5 text-xs">
                                           👍 {msg.reactions?.length}
                                        </div>
                                    )}
                                </div>
                                {!isOwnMessage && <div className="opacity-0 group-hover:opacity-100 transition-opacity"><MessageActions message={msg} onAction={(action) => handleMessageAction(msg, action)}/></div>}
                            </div>
                        )
                    })}
                </main>

                <footer className="p-4 border-t bg-card shrink-0 fixed bottom-16 md:relative md:bottom-0 w-full">
                     {editingMessage && (
                        <div className="flex items-center justify-between bg-secondary p-2 rounded-md mb-2 border">
                            <div>
                                <p className="font-bold text-sm">Editing Message</p>
                                <p className="text-xs text-muted-foreground truncate">{editingMessage.content}</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingMessage(null); setNewMessage(""); }}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                    {imagePreview && (
                        <div className="relative w-24 h-24 mb-2">
                            <Image src={imagePreview} alt="Image preview" fill className="object-cover rounded-md" />
                            <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setImagePreview(null); setImageData(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/png, image/jpeg"
                            className="hidden"
                        />
                         <Button type="button" variant="secondary" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                            <ImagePlus className="h-5 w-5"/>
                        </Button>
                        <Input 
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                        />
                        <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && !imageData)}>
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                        </Button>
                    </form>
                </footer>
            </div>
       </div>
    );
}
