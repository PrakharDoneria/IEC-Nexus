
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from "@/components/NeoCard";
import { Button } from "@/components/ui/button";
import { Group } from "@/lib/types";
import { Plus, LogIn, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';


function GroupCard({ group }: { group: Group }) {
    return (
        <NeoCard className="overflow-hidden transition-transform hover:-translate-y-1">
            <div className="h-32 bg-secondary border-b">
                <Image src={group.coverImage} alt={`${group.name} cover`} width={400} height={150} className="w-full h-full object-cover" data-ai-hint="group cover"/>
            </div>
            <NeoCardHeader className="p-4">
                <h3 className="text-xl font-bold">{group.name}</h3>
                <p className="text-sm text-muted-foreground h-10 overflow-hidden">{group.description}</p>
            </NeoCardHeader>
            <NeoCardFooter className="p-4 pt-2 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{group.memberCount} members</span>
                <Button size="sm" asChild>
                    <Link href={`/groups/${group._id?.toString()}`}>View</Link>
                </Button>
            </NeoCardFooter>
        </NeoCard>
    )
}

function JoinGroupDialog({ onGroupJoined, asChild }: { onGroupJoined: (groupId: string) => void; asChild?: boolean }) {
    const { idToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");

    const handleJoin = async () => {
        if (!code.trim() || !idToken) return;
        setLoading(true);

        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                body: JSON.stringify({ inviteCode: code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to join group');
            
            toast({ title: "Success", description: `You have joined the group!` });
            onGroupJoined(data.groupId);
            setOpen(false);
            setCode("");

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const Trigger = asChild ? DropdownMenuItem : Button;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Trigger variant={asChild ? undefined : "secondary"} onSelect={(e) => e.preventDefault()}>
                    <LogIn className="mr-2 h-4 w-4" /> Join Group
                </Trigger>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join a Group</DialogTitle>
                    <DialogDescription>
                        Enter the invite code to join an existing group.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">
                            Invite Code
                        </Label>
                        <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="abc-123" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleJoin} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Join
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CreateGroupDialog({ onGroupCreated, asChild }: { onGroupCreated: () => void; asChild?: boolean }) {
    const { idToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleCreate = async () => {
        if (!name.trim() || !description.trim() || !idToken) return;
        setLoading(true);

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                body: JSON.stringify({ name, description }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create group');

            toast({ title: "Group Created!", description: `Invite code: ${data.inviteCode}` });
            onGroupCreated();
            setOpen(false);
            setName("");
            setDescription("");

        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const Trigger = asChild ? DropdownMenuItem : Button;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Trigger onSelect={asChild ? (e) => e.preventDefault() : undefined}>
                    <Plus className="mr-2 h-4 w-4" /> Create Group
                </Trigger>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a New Group</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create your own collaboration space.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., AI & Machine Learning Club" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of your group" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleCreate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GroupsPage() {
    const { idToken } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isFetching = useRef(false);
    const router = useRouter();

    const fetchGroups = useCallback(async (isBackground = false) => {
        if(isFetching.current || !idToken) return;
        isFetching.current = true;

        if(!isBackground) setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/groups', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!res.ok) throw new Error("Failed to fetch groups");
            const data = await res.json();
            setGroups(data);
        } catch (err: any) {
            setError(err.message);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your groups.' });
        } finally {
            if(!isBackground) setLoading(false);
            isFetching.current = false;
        }
    }, [idToken]);

    useEffect(() => {
        if(idToken) {
            fetchGroups();
        }
    }, [idToken, fetchGroups]);
    
    const handleJoinSuccess = (groupId: string) => {
        router.push(`/groups/${groupId}`);
    };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <MobileNav pageTitle="My Groups">
           <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <CreateGroupDialog onGroupCreated={() => fetchGroups(true)} asChild/>
                        <JoinGroupDialog onGroupJoined={handleJoinSuccess} asChild/>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </MobileNav>
        <header className="hidden md:flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <h1 className="text-2xl font-bold">My Groups</h1>
            <div className="flex items-center gap-2 sm:gap-4">
                <JoinGroupDialog onGroupJoined={handleJoinSuccess} />
                <CreateGroupDialog onGroupCreated={() => fetchGroups(true)} />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {loading && <div className="flex justify-center mt-8"><Loader2 className="h-10 w-10 animate-spin"/></div>}
            {error && <p className="text-center text-destructive mt-8">{error}</p>}
            {!loading && !error && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groups.map(group => <GroupCard key={group._id?.toString()} group={group} />)}
                </div>
            )}
            {!loading && !error && groups.length === 0 && (
                <div className="text-center mt-20 flex flex-col items-center">
                    <h2 className="text-2xl font-bold">You haven't joined any groups yet.</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">Join an existing group with an invite code or create a new one to start collaborating.</p>
                    <div className="flex gap-4 mt-6">
                        <JoinGroupDialog onGroupJoined={handleJoinSuccess} />
                        <CreateGroupDialog onGroupCreated={() => fetchGroups(true)} />
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
