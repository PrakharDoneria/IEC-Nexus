
'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NeoButton } from "@/components/NeoButton";
import { Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Send, ArrowLeft, ImagePlus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const MAX_IMAGE_SIZE_MB = 5;

export default function ChatPage() {
    const { user, idToken, authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [participant, setParticipant] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    }

    const fetchMessages = useCallback(async (isBackground = false) => {
        if (!conversationId || isFetching.current || !idToken) return;
        isFetching.current = true;
        if (!isBackground) {
            setLoading(true);
        }
        try {
            const res = await fetch(`/api/messages/${conversationId}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to load messages");
            const data = await res.json();
            setMessages(data.messages);
            setParticipant(data.participant);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.'});
            router.push('/messages');
        } finally {
            if (!isBackground) {
                setLoading(false);
            }
            isFetching.current = false;
        }
    }, [conversationId, idToken, router]);


    useEffect(() => {
        if (conversationId && idToken) {
            fetchMessages(false); // Initial fetch shows loader
        }
    }, [conversationId, idToken, fetchMessages]);

    useEffect(() => {
       if (messages.length > 0) {
            scrollToBottom();
       }
    }, [messages]);

    useEffect(() => {
         if (!idToken) return;
        // Poll for new messages every 5 seconds
        const intervalId = setInterval(() => fetchMessages(true), 5000); // Background fetches don't show loader
        return () => clearInterval(intervalId);
    }, [idToken, fetchMessages])

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
        try {
            const res = await fetch(`/api/messages/${conversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newMessage, imageUrl: imageData })
            });
            if (!res.ok) throw new Error("Failed to send message");
            const sentMessage = await res.json();
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage("");
            setImageData(null);
            setImagePreview(null);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.'});
        } finally {
            setSending(false);
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
                <MobileNav />
                <header className="flex h-16 shrink-0 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => router.push('/messages')}>
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
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

                <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/50">
                    {messages.map((msg, index) => (
                        <div key={msg._id?.toString() || index} className={cn("flex items-end gap-2", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
                            {msg.senderId !== user?.id && (
                                <Avatar className="h-8 w-8 self-start">
                                    <AvatarImage src={msg.sender?.avatar} />
                                    <AvatarFallback>{msg.sender?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                "max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-xl border-2 border-foreground", 
                                msg.senderId === user?.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card rounded-bl-none"
                            )}>
                                {msg.imageUrl && (
                                    <Image src={msg.imageUrl} alt="Chat image" width={300} height={300} className="rounded-lg object-cover" />
                                )}
                                {msg.content && <p className="p-2 whitespace-pre-wrap">{msg.content}</p>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t-2 border-foreground bg-card shrink-0">
                    {imagePreview && (
                        <div className="relative w-24 h-24 mb-2">
                            <Image src={imagePreview} alt="Image preview" layout="fill" className="object-cover rounded-md" />
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
                         <NeoButton type="button" variant="secondary" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                            <ImagePlus className="h-5 w-5"/>
                        </NeoButton>
                        <Input 
                            placeholder="Type a message..." 
                            className="border-2 border-foreground"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                        />
                        <NeoButton type="submit" size="icon" disabled={sending || (!newMessage.trim() && !imageData)}>
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                        </NeoButton>
                    </form>
                </footer>
            </div>
       </div>
    );
}
