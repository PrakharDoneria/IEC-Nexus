
'use client';

import * as React from 'react';
import Image from 'next/image';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Group, GroupMessage, GroupAnnouncement, User, GroupMember } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, MessageSquare, Megaphone, Users, Settings, Send, Copy, Camera, Trash2, Smile, Pencil, MoreHorizontal, ThumbsUp, X, LogOut, ShieldCheck, User as UserIcon, Download, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { getMessaging, onMessage } from 'firebase/messaging';
import app from '@/lib/firebase';
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


const MAX_IMAGE_SIZE_MB = 5;

function ModeratorDeleteDialog({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: (reason: string) => void }) {
    const [reason, setReason] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm(reason);
        setLoading(false);
        onOpenChange(false);
    }
    
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message</AlertDialogTitle>
                    <AlertDialogDescription>
                        As a moderator, you can delete this message. Please provide a brief reason for this action.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="delete-reason">Reason for deletion</Label>
                    <Textarea id="delete-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Violates community guidelines." />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={loading || !reason.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirm Deletion
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function GroupMessageActions({ message, currentUserRole, onAction }: { message: GroupMessage, currentUserRole: string, onAction: (action: 'edit' | 'delete' | 'react', payload?: any) => void }) {
    const { user } = useAuth();
    const [modDeleteOpen, setModDeleteOpen] = React.useState(false);
    const canPerformAction = message.senderId === user?.id;
    const canModerate = ['owner', 'moderator'].includes(currentUserRole);

    const handleDeleteClick = () => {
        if (canModerate && !canPerformAction) {
            setModDeleteOpen(true);
        } else {
            onAction('delete');
        }
    }
    
    const handleModDeleteConfirm = (reason: string) => {
        onAction('delete', { reason });
    }

    return (
        <>
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
                    <DropdownMenuItem onClick={() => onAction('edit')}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                 )}
                 {(canPerformAction || canModerate) && (
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
                                <AlertDialogDescription>This will permanently delete this message.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteClick}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
            </DropdownMenuContent>
        </DropdownMenu>
        {canModerate && !canPerformAction && (
             <ModeratorDeleteDialog open={modDeleteOpen} onOpenChange={setModDeleteOpen} onConfirm={handleModDeleteConfirm} />
        )}
        </>
    )
}

function ChatTab({ groupId, currentUserRole }: { groupId: string, currentUserRole: string }) {
    const { user, idToken } = useAuth();
    const [messages, setMessages] = React.useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const [editingMessage, setEditingMessage] = React.useState<GroupMessage | null>(null);

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }

    const fetchMessages = React.useCallback(async () => {
        if (!idToken) return;
        try {
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to fetch messages");
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
        } finally {
            setLoading(false);
        }
    }, [groupId, idToken]);

    React.useEffect(() => {
        setLoading(true);
        fetchMessages();
    }, [fetchMessages]);

    // Real-time listener for new messages
    React.useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};
        
        try {
            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                // If we get a notification for the current group, refetch messages
                if (payload.data?.link?.includes(`/groups/${groupId}`)) {
                    fetchMessages();
                }
            });

            return () => unsubscribe();
        } catch(e) {
            console.error("Error setting up foreground message listener in Group Chat:", e);
            return () => {};
        }
    }, [groupId, fetchMessages]);
    
     React.useEffect(() => {
        if (!loading) {
             scrollToBottom('auto');
        }
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !idToken) return;
        setSending(true);

        if(editingMessage) {
             try {
                const res = await fetch(`/api/groups/${groupId}/messages/${editingMessage._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ content: newMessage })
                });
                 if (!res.ok) throw new Error("Failed to edit message");
                 setMessages(prev => prev.map(m => m._id === editingMessage._id ? {...m, content: newMessage, isEdited: true} : m));
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
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newMessage })
            });
             if (!res.ok) throw new Error('Failed to send message');
             const sentMessage = await res.json();
             
             setMessages(prev => [...prev, sentMessage]);
             setNewMessage('');
             scrollToBottom();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
        } finally {
            setSending(false);
        }
    }

    const handleMessageAction = async (message: GroupMessage, action: 'edit' | 'delete' | 'react', payload?: any) => {
        if (!idToken || !user) return;

        if (action === 'edit') {
            if (message.senderId !== user?.id) return;
            setEditingMessage(message);
            setNewMessage(message.content);
        } else if (action === 'delete') {
            try {
                const res = await fetch(`/api/groups/${groupId}/messages/${message._id}`, {
                    method: 'DELETE', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ reason: payload?.reason })
                });
                if (!res.ok) throw new Error("Failed to delete message");
                await fetchMessages(); // Refetch to show the deleted message placeholder
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not delete message.'});
            }
        } else if (action === 'react') {
            if (message.isDeleted) return;
            const emoji = '👍'; // Hardcoding a thumbs up for now
             try {
                const res = await fetch(`/api/groups/${groupId}/messages/${message._id}/react`, {
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

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg) => {
                     if (!msg.sender) return null; // Don't render if sender info is missing
                     const isOwnMessage = msg.senderId === user?.id;
                     return (
                         <div key={msg._id?.toString()} className={cn("flex items-end gap-2 group", isOwnMessage ? "justify-end" : "justify-start")}>
                            {isOwnMessage && !msg.isDeleted && <div className="opacity-0 group-hover:opacity-100 transition-opacity"><GroupMessageActions message={msg} currentUserRole={currentUserRole} onAction={(action, payload) => handleMessageAction(msg, action, payload)}/></div>}
                             {!isOwnMessage && (
                                <Avatar className="h-8 w-8 self-start">
                                    <AvatarImage src={msg.sender?.avatar} />
                                    <AvatarFallback>{msg.sender?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                             <div className="flex flex-col" style={{ alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                                 {!msg.isDeleted && (
                                    <div className="flex items-baseline gap-2" style={{ flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}>
                                        <p className="font-bold text-sm">{msg.sender?.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</p>
                                    </div>
                                 )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-xl relative mt-1", 
                                    isOwnMessage && !msg.isDeleted ? "bg-primary text-primary-foreground rounded-br-none" : "",
                                    !isOwnMessage && !msg.isDeleted ? "bg-card rounded-bl-none" : "",
                                    msg.isDeleted ? "bg-transparent" : ""
                                )}>
                                    <p className={cn("p-2 whitespace-pre-wrap", msg.isDeleted && "text-sm italic text-muted-foreground")}>{msg.content}</p>
                                    {msg.isEdited && <p className="text-xs px-2 pb-1 opacity-70">(edited)</p>}
                                    {(msg.reactions?.length || 0) > 0 && (
                                        <div className="absolute -bottom-3 -right-1 bg-secondary border rounded-full px-1.5 py-0.5 text-xs">
                                           👍 {msg.reactions?.length}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!isOwnMessage && !msg.isDeleted && <div className="opacity-0 group-hover:opacity-100 transition-opacity"><GroupMessageActions message={msg} currentUserRole={currentUserRole} onAction={(action, payload) => handleMessageAction(msg, action, payload)}/></div>}
                        </div>
                     )
                })}
                <div ref={messagesEndRef} />
            </div>
             <div className="p-4 border-t bg-card shrink-0">
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
                 <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function AnnouncementsTab({ groupId }: { groupId: string }) {
    const { user, idToken } = useAuth();
    const [announcements, setAnnouncements] = React.useState<GroupAnnouncement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = React.useState('');
    const [attachmentLink, setAttachmentLink] = React.useState('');
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageData, setImageData] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [loading, setLoading] = React.useState(true);
    const [posting, setPosting] = React.useState(false);

    const fetchAnnouncements = React.useCallback(async () => {
        if (!idToken) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/groups/${groupId}/announcements`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to fetch announcements");
            const data = await res.json();
            setAnnouncements(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load announcements.' });
        } finally {
            setLoading(false);
        }
    }, [groupId, idToken]);

    React.useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

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

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.trim() || !idToken) return;
        setPosting(true);
        try {
            const payload: { content: string, attachmentLink?: string, imageUrl?: string } = { content: newAnnouncement };
            if (attachmentLink) payload.attachmentLink = attachmentLink;
            if (imageData) payload.imageUrl = imageData;

            const res = await fetch(`/api/groups/${groupId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to post announcement');
            await fetchAnnouncements(); // Re-fetch all
            setNewAnnouncement('');
            setAttachmentLink('');
            setImageData(null);
            setImagePreview(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post announcement.' });
        } finally {
            setPosting(false);
        }
    }

    return (
        <div className="p-4 space-y-6">
            {user?.role === 'Faculty' && (
                 <form onSubmit={handlePostAnnouncement}>
                    <Card>
                        <CardHeader>
                            <h3 className="font-bold">Post an Announcement</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Type your announcement here..."
                                className="min-h-24"
                                value={newAnnouncement}
                                onChange={(e) => setNewAnnouncement(e.target.value)}
                                disabled={posting}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="attachment-link">Attachment Link (Optional)</Label>
                                <Input id="attachment-link" placeholder="https://example.com/file.pdf" value={attachmentLink} onChange={(e) => setAttachmentLink(e.target.value)} disabled={posting} />
                            </div>
                            <div className="space-y-2">
                                <Label>Attach Image (Optional)</Label>
                                <Input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/png, image/jpeg" className="hidden"/>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={posting}>
                                        <Camera className="mr-2 h-4 w-4"/>
                                        Choose Image
                                    </Button>
                                    {imagePreview && (
                                        <div className="relative h-16 w-16">
                                            <Image src={imagePreview} alt="Image preview" fill className="rounded-md object-cover" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => { setImagePreview(null); setImageData(null); }}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={posting || !newAnnouncement.trim()}>
                                {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Post
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            )}

            <div className="space-y-4">
                 {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                 {!loading && announcements.length === 0 && (
                     <p className="text-center text-muted-foreground pt-8">No announcements yet.</p>
                 )}
                 {!loading && announcements.map((item) => (
                    <Card key={item._id?.toString()}>
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={item.author?.avatar} />
                                    <AvatarFallback>{item.author?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{item.author?.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="whitespace-pre-wrap">{item.content}</p>
                            {item.imageUrl && (
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={item.imageUrl} alt="Announcement attachment" layout="fill" objectFit="contain" />
                                </div>
                            )}
                        </CardContent>
                        {(item.imageUrl || item.attachmentLink) && (
                            <CardFooter className="flex gap-2">
                                {item.imageUrl && (
                                    <Button asChild variant="secondary" size="sm">
                                        <a href={item.imageUrl} download target="_blank"><Download className="mr-2 h-4 w-4" />Download Image</a>
                                    </Button>
                                )}
                                {item.attachmentLink && (
                                    <Button asChild variant="secondary" size="sm">
                                        <a href={item.attachmentLink} target="_blank" rel="noopener noreferrer"><LinkIcon className="mr-2 h-4 w-4" />Open Link</a>
                                    </Button>
                                )}
                            </CardFooter>
                        )}
                    </Card>
                 ))}
            </div>
        </div>
    )
}

function MembersTab({ group, onMemberRoleChange }: { group: Group, onMemberRoleChange: () => void }) {
    const { user: currentUser, idToken } = useAuth();
    const isOwner = group.createdBy === currentUser?.id;

    const handleRoleChange = async (memberId: string, role: 'moderator' | 'member') => {
        if (!idToken || !isOwner || memberId === currentUser?.id) return;
        
        try {
            const res = await fetch(`/api/groups/${group._id}/members`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ memberId, role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");

            toast({ title: "Success", description: "Member role has been updated." });
            onMemberRoleChange();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <div className="p-4 space-y-3">
            {group.members.map(member => (
                <Card key={member.userId}>
                    <CardContent className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={(member as any).avatar} />
                                <AvatarFallback>{(member as any).name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{(member as any).name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOwner && member.userId !== currentUser?.id && (
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="sm">
                                            {member.role === 'moderator' ? <ShieldCheck className="mr-2 h-4 w-4"/> : <UserIcon className="mr-2 h-4 w-4"/> }
                                             Change Role
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Assign Role</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuRadioGroup value={member.role} onValueChange={(value) => handleRoleChange(member.userId, value as 'moderator' | 'member')}>
                                            <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="moderator">Moderator</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <Button size="sm" asChild>
                                <a href={`/profile/${member.userId}`}>View</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function SettingsTab({ group, onGroupUpdated }: { group: Group, onGroupUpdated: (updatedGroup: Group) => void }) {
    const { user, idToken } = useAuth();
    const router = useRouter();
    const [name, setName] = React.useState(group.name);
    const [description, setDescription] = React.useState(group.description);
    const [loading, setLoading] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    const [leaving, setLeaving] = React.useState(false);
    
    const [coverImage, setCoverImage] = React.useState(group.coverImage);
    const [coverImageData, setCoverImageData] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isOwner = group.createdBy === user?.id;

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                setCoverImage(URL.createObjectURL(file)); // For preview
                setCoverImageData(reader.result as string); // For upload
            };
            reader.readAsDataURL(file);
        }
    };


    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim() || !idToken) return;
        setLoading(true);

        const payload: any = { name, description };
        if (coverImageData) {
            payload.coverImage = coverImageData;
        }

        try {
            const res = await fetch(`/api/groups/${group._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update group");
            toast({ title: 'Success', description: 'Group details updated.' });
            onGroupUpdated(data.group);
            setCoverImageData(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    }
    
    const copyInviteCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        toast({ title: 'Copied!', description: 'Invite code copied to clipboard.' });
    }

    const handleDelete = async () => {
        setDeleting(true);
        try {
             if (!idToken) throw new Error("Authentication required.");
             const res = await fetch(`/api/groups/${group._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${idToken}` }
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message || "Failed to delete group.");
             toast({ title: "Group Deleted", description: "The group has been permanently removed." });
             router.push('/groups');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setDeleting(false);
        }
    }
    
    const handleLeaveGroup = async () => {
        setLeaving(true);
        try {
             if (!idToken) throw new Error("Authentication required.");
             const res = await fetch(`/api/groups/${group._id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` }
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message || "Failed to leave group.");
             toast({ title: "Success", description: "You have left the group." });
             router.push('/groups');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLeaving(false);
        }
    };


    return (
        <div className="p-4 space-y-8">
            {isOwner && (
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Group Cover Image</Label>
                        <div className="flex items-center gap-4">
                            <Image src={coverImage} alt="Group cover preview" width={128} height={128} className="w-32 h-20 rounded-md object-cover border" />
                            <input type="file" ref={fileInputRef} onChange={handleCoverImageChange} accept="image/png, image/jpeg" className="hidden"/>
                            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="mr-2 h-4 w-4"/>
                                Change
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Group Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                     <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Changes
                        </Button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex gap-2">
                    <Input value={group.inviteCode} readOnly className="font-mono" />
                    <Button type="button" variant="secondary" size="icon" onClick={copyInviteCode}><Copy className="h-5 w-5"/></Button>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="font-bold text-lg text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mt-1">These actions cannot be undone.</p>
                <div className="mt-4">
                    {isOwner ? (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={deleting}>
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Delete this group
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete the <strong>{group.name}</strong> group and all of its data.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Yes, delete group
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={leaving}>
                                    <LogOut className="mr-2 h-4 w-4"/>
                                    Leave Group
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You will need a new invite code to rejoin the <strong>{group.name}</strong> group.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={handleLeaveGroup}
                                    disabled={leaving}
                                >
                                    {leaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Yes, leave group
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function GroupPage() {
    const { user, idToken, authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;
    
    const [group, setGroup] = React.useState<Group | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchGroup = React.useCallback(async () => {
        if (!idToken) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Group not found or you are not a member.");
            const data = await res.json();
            setGroup(data);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push('/groups');
        } finally {
            setLoading(false);
        }
    }, [groupId, idToken, router]);

    React.useEffect(() => {
        if (!authLoading) {
            fetchGroup();
        }
    }, [authLoading, fetchGroup]);

    const handleGroupUpdated = (updatedGroup: Group) => {
        setGroup(prev => ({...prev, ...updatedGroup}));
    };

    const myRole = group?.members.find(m => m.userId === user?.id)?.role || 'member';

    if (loading || authLoading) {
        return (
            <div className="flex min-h-screen bg-background">
                <AppSidebar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin" />
                </div>
            </div>
        )
    }

    if (!group) return null; // Should be redirected by fetchGroup on error

    return (
        <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                 <header className="md:hidden sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 z-10">
                    <div className="flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={() => router.push('/groups')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Image src={group.coverImage} alt="group cover" width={40} height={40} className="rounded-md object-cover h-10 w-10 border"/>
                         <div>
                            <h1 className="text-lg font-bold truncate">{group.name}</h1>
                            <p className="text-xs text-muted-foreground">{group.members.length} members</p>
                        </div>
                    </div>
                 </header>
                <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 md:px-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/groups')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Image src={group.coverImage} alt="group cover" width={40} height={40} className="rounded-md object-cover h-10 w-10 border"/>
                    <div>
                        <h1 className="text-xl font-bold">{group.name}</h1>
                        <p className="text-xs text-muted-foreground">{group.members.length} members</p>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <Tabs defaultValue="announcements" className="w-full h-full flex flex-col">
                         <div className="px-4 pt-4">
                            <ScrollArea>
                                <TabsList>
                                    <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4"/>Announcements</TabsTrigger>
                                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/>Chat</TabsTrigger>
                                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4"/>Members</TabsTrigger>
                                    <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/>Settings</TabsTrigger>
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                            <ChatTab groupId={groupId} currentUserRole={myRole} />
                        </TabsContent>
                        <TabsContent value="announcements" className="mt-0">
                            <AnnouncementsTab groupId={groupId} />
                        </TabsContent>
                        <TabsContent value="members" className="mt-0">
                            <MembersTab group={group} onMemberRoleChange={fetchGroup} />
                        </TabsContent>
                         <TabsContent value="settings" className="mt-0">
                            <SettingsTab group={group} onGroupUpdated={handleGroupUpdated} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}

    