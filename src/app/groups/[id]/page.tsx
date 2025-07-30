
'use client';

import * as React from 'react';
import Image from 'next/image';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardFooter } from '@/components/NeoCard';
import { NeoButton } from '@/components/NeoButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Group, GroupMessage, GroupAnnouncement, User } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, MessageSquare, Megaphone, Users, Settings, Send, Copy, Camera, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
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

const MAX_IMAGE_SIZE_MB = 5;

function ChatTab({ groupId, members }: { groupId: string, members: User[] }) {
    const { user, idToken } = useAuth();
    const [messages, setMessages] = React.useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const memberMap = React.useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const fetchMessages = React.useCallback(async (isBackground = false) => {
        if (!idToken) return;
        if(!isBackground) setLoading(true);
        try {
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to fetch messages");
            const data = await res.json();
            
            const populatedMessages = data.map((msg: GroupMessage) => ({
                ...msg,
                sender: memberMap.get(msg.senderId)
            }));
            
            setMessages(populatedMessages);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
        } finally {
            if(!isBackground) setLoading(false);
        }
    }, [groupId, idToken, memberMap]);

    React.useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);
    
    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !idToken) return;
        setSending(true);

        try {
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newMessage })
            });
             if (!res.ok) throw new Error('Failed to send message');
             const sentMessage = await res.json();
             
             setMessages(prev => [...prev, { ...sentMessage, sender: memberMap.get(sentMessage.senderId) }]);
             setNewMessage('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg._id?.toString()} className="flex gap-3">
                        <Avatar>
                            <AvatarImage src={msg.sender?.avatar} />
                            <AvatarFallback>{msg.sender?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <p className="font-bold">{msg.sender?.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</p>
                            </div>
                            <p className="bg-secondary p-3 rounded-lg border-2 border-foreground mt-1 inline-block">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
             <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-foreground flex gap-2">
                <Input
                    placeholder="Type a message..."
                    className="border-2 border-foreground"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                />
                <NeoButton type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </NeoButton>
            </form>
        </div>
    );
}

function AnnouncementsTab({ groupId }: { groupId: string }) {
    const { user, idToken } = useAuth();
    const [announcements, setAnnouncements] = React.useState<GroupAnnouncement[]>([]);
    const [newAnnouncement, setNewAnnouncement] = React.useState('');
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

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.trim() || !idToken) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/groups/${groupId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: newAnnouncement })
            });
            if (!res.ok) throw new Error('Failed to post announcement');
            await fetchAnnouncements(); // Re-fetch all
            setNewAnnouncement('');
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
                    <NeoCard>
                        <NeoCardHeader>
                            <h3 className="font-headline font-bold">Post an Announcement</h3>
                        </NeoCardHeader>
                        <NeoCardContent>
                            <Textarea
                                placeholder="Type your announcement here..."
                                className="border-2 border-foreground min-h-24"
                                value={newAnnouncement}
                                onChange={(e) => setNewAnnouncement(e.target.value)}
                                disabled={posting}
                            />
                        </NeoCardContent>
                        <NeoCardFooter className="flex justify-end">
                            <NeoButton type="submit" disabled={posting || !newAnnouncement.trim()}>
                                {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Post
                            </NeoButton>
                        </NeoCardFooter>
                    </NeoCard>
                </form>
            )}

            <div className="space-y-4">
                 {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                 {!loading && announcements.length === 0 && (
                     <p className="text-center text-muted-foreground pt-8">No announcements yet.</p>
                 )}
                 {!loading && announcements.map((item) => (
                    <NeoCard key={item._id?.toString()}>
                        <NeoCardHeader>
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
                        </NeoCardHeader>
                        <NeoCardContent>
                            <p className="whitespace-pre-wrap">{item.content}</p>
                        </NeoCardContent>
                    </NeoCard>
                 ))}
            </div>
        </div>
    )
}

function MembersTab({ members }: { members: User[] }) {
    return (
        <div className="p-4 space-y-3">
            {members.map(member => (
                <NeoCard key={member.id}>
                    <NeoCardContent className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        </div>
                         <NeoButton size="sm" asChild>
                            <a href={`/profile/${member.id}`}>View</a>
                        </NeoButton>
                    </NeoCardContent>
                </NeoCard>
            ))}
        </div>
    )
}

function SettingsTab({ group, onGroupUpdated }: { group: Group, onGroupUpdated: (updatedGroup: Group) => void }) {
    const { idToken } = useAuth();
    const router = useRouter();
    const [name, setName] = React.useState(group.name);
    const [description, setDescription] = React.useState(group.description);
    const [loading, setLoading] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    
    const [coverImage, setCoverImage] = React.useState(group.coverImage);
    const [coverImageData, setCoverImageData] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    return (
        <div className="p-4 space-y-8">
            <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                    <Label>Group Cover Image</Label>
                    <div className="flex items-center gap-4">
                        <Image src={coverImage} alt="Group cover preview" width={128} height={128} className="w-32 h-20 rounded-md object-cover border-2 border-foreground" />
                        <input type="file" ref={fileInputRef} onChange={handleCoverImageChange} accept="image/png, image/jpeg" className="hidden"/>
                        <NeoButton type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="mr-2 h-4 w-4"/>
                            Change
                        </NeoButton>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} className="border-2 border-foreground" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Group Description</Label>
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="border-2 border-foreground" />
                </div>
                <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex gap-2">
                        <Input value={group.inviteCode} readOnly className="border-2 border-foreground font-code" />
                        <NeoButton type="button" variant="secondary" size="icon" onClick={copyInviteCode}><Copy className="h-5 w-5"/></NeoButton>
                    </div>
                </div>
                <div className="flex justify-end">
                    <NeoButton type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </NeoButton>
                </div>
            </form>

            <div className="border-t-2 border-destructive pt-6">
                <h3 className="font-headline font-bold text-lg text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mt-1">This action cannot be undone. This will permanently delete the group, including all messages and announcements.</p>
                <div className="mt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <NeoButton variant="destructive" disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete this group
                        </NeoButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline">Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the <strong>{group.name}</strong> group and all of its data.
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
        setGroup(updatedGroup);
    };

    const isOwner = user && group && user.id === group.createdBy;

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
            <div className="flex-1 flex flex-col pb-16 md:pb-0">
                <MobileNav />
                <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-foreground bg-card px-4 md:px-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/groups')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Image src={group.coverImage} alt="group cover" width={40} height={40} className="rounded-md object-cover h-10 w-10 border-2 border-foreground" data-ai-hint="group cover"/>
                    <div>
                        <h1 className="text-xl font-headline font-bold">{group.name}</h1>
                        <p className="text-xs text-muted-foreground">{group.members.length} members</p>
                    </div>
                </header>
                <main className="flex-1">
                    <Tabs defaultValue="chat" className="w-full">
                        <TabsList className="m-4">
                            <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/>Chat</TabsTrigger>
                            <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4"/>Announcements</TabsTrigger>
                            <TabsTrigger value="members"><Users className="mr-2 h-4 w-4"/>Members</TabsTrigger>
                            {isOwner && <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/>Settings</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="chat">
                            <ChatTab groupId={groupId} members={group.members as User[]} />
                        </TabsContent>
                        <TabsContent value="announcements">
                            <AnnouncementsTab groupId={groupId} />
                        </TabsContent>
                        <TabsContent value="members">
                            <MembersTab members={group.members as User[]} />
                        </TabsContent>
                         {isOwner && (
                             <TabsContent value="settings">
                                <SettingsTab group={group} onGroupUpdated={handleGroupUpdated} />
                            </TabsContent>
                         )}
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
