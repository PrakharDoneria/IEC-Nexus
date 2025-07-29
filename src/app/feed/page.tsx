
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from '@/components/NeoCard';
import { NeoButton } from '@/components/NeoButton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Link as LinkIcon, Users, BookOpen, Search, Share2, MoreVertical, Trash2, Copy } from 'lucide-react';
import { mockPosts as initialMockPosts, mockGroups, mockUsers } from '@/lib/mock';
import type { Post } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';


function CreatePost({ onAddPost }: { onAddPost: (newPost: Post) => void }) {
  const [postContent, setPostContent] = useState('');
  const currentUser = mockUsers[0];

  const handlePost = () => {
    if (!postContent.trim()) return;

    const newPost: Post = {
        id: `p${Date.now()}`,
        author: currentUser,
        content: postContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
    };
    onAddPost(newPost);
    setPostContent('');
  };

  return (
    <NeoCard>
      <NeoCardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="hidden sm:block">
            <AvatarImage src="https://placehold.co/100x100/A7C4D3/000000" data-ai-hint="user avatar" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder="What's on your mind, Alia?"
              className="min-h-24 border-2 border-foreground mb-4"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon">
                    <LinkIcon className="h-5 w-5"/>
                </Button>
                <NeoButton onClick={handlePost}>Post</NeoButton>
            </div>
          </div>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function ShareDialog({ post }: { post: Post }) {
  const [postUrl, setPostUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setPostUrl(`${window.location.origin}/posts/${post.id}`);
    }
  }, [post.id]);

  const embedCode = `<iframe src="${postUrl}" width="600" height="400" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} Copied!`,
      description: "The content has been copied to your clipboard.",
    })
  }

  return (
     <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-headline">Share Post</DialogTitle>
          <DialogDescription>
            Share this post with others via a link or embed it on a website.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-link" className="font-semibold">Post Link</Label>
              <div className="flex gap-2">
                <Input id="post-link" value={postUrl} readOnly className="border-2 border-foreground"/>
                <NeoButton size="icon" onClick={() => copyToClipboard(postUrl, 'Link')}><Copy className="h-5 w-5"/></NeoButton>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="embed-code" className="font-semibold">Embed Code</Label>
               <div className="flex gap-2">
                <Textarea id="embed-code" value={embedCode} readOnly className="border-2 border-foreground font-code text-sm" rows={4}/>
                <NeoButton size="icon" onClick={() => copyToClipboard(embedCode, 'Embed Code')}><Copy className="h-5 w-5"/></NeoButton>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


function PostCard({ post }: { post: Post }) {
  const currentUser = mockUsers[1]; // Mock as faculty to show admin options

  return (
    <NeoCard>
      <NeoCardHeader className="p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.author.avatar} data-ai-hint="user avatar" />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{post.author.role} &middot; {post.timestamp}</p>
              </div>
            </div>
            {currentUser.role === 'Faculty' && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            <span>Delete Post</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </NeoCardHeader>
      <NeoCardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.resourceLink && (
            <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-md border-2 border-foreground hover:bg-primary/20">
                <LinkIcon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate text-sm font-medium">{post.resourceLink}</span>
            </a>
        )}
      </NeoCardContent>
      <NeoCardFooter className="p-4 pt-0">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" /> {post.likes}
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> {post.comments}
          </Button>
           <ShareDialog post={post} />
        </div>
      </NeoCardFooter>
    </NeoCard>
  );
}

function RightSidebar() {
    return (
        <aside className="hidden lg:block w-80 space-y-6">
            <NeoCard>
                <NeoCardHeader className="p-4">
                    <h2 className="font-headline font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5"/> My Groups</h2>
                </NeoCardHeader>
                <NeoCardContent className="p-4 pt-0 space-y-3">
                    {mockGroups.slice(0, 3).map(group => (
                        <div key={group.id} className="flex items-center gap-3">
                            <Image src={group.coverImage} alt={group.name} width={40} height={40} className="rounded-md border-2 border-foreground" data-ai-hint="group image"/>
                            <div>
                                <Link href="/groups" className="font-semibold hover:underline">{group.name}</Link>
                                <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                            </div>
                        </div>
                    ))}
                </NeoCardContent>
                <NeoCardFooter className="p-4 pt-0">
                    <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href="/groups">View all groups</Link>
                    </Button>
                </NeoCardFooter>
            </NeoCard>

             <NeoCard>
                <NeoCardHeader className="p-4">
                    <h2 className="font-headline font-bold text-lg flex items-center gap-2"><BookOpen className="h-5 w-5"/> Suggested Resources</h2>
                </NeoCardHeader>
                <NeoCardContent className="p-4 pt-0">
                   <p className="text-sm text-muted-foreground">AI-powered resource suggestions based on recent activity will appear here.</p>
                </NeoCardContent>
                 <NeoCardFooter className="p-4 pt-0">
                    <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href="/resources">Generate Resources</Link>
                    </Button>
                </NeoCardFooter>
            </NeoCard>
        </aside>
    )
}

export default function FeedPage() {
  const [mockPosts, setMockPosts] = useState(initialMockPosts);

  const handleAddPost = (newPost: Post) => {
    setMockPosts([newPost, ...mockPosts]);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center gap-4 border-b-2 border-foreground bg-card px-4 md:px-6">
            <div className="flex-1">
                <h1 className="text-2xl font-headline font-bold">Activity Feed</h1>
            </div>
            <div className="w-full max-w-sm">
                <form>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search posts and resources..." className="pl-10 border-2 border-foreground"/>
                    </div>
                </form>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex gap-8">
            <div className="flex-1 space-y-6">
                <CreatePost onAddPost={handleAddPost} />
                <div className="space-y-6">
                    {mockPosts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            </div>
            <RightSidebar />
        </main>
      </div>
    </div>
  );
}
