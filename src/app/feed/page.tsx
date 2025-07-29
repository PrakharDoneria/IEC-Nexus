
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from '@/components/NeoCard';
import { NeoButton } from '@/components/NeoButton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Link as LinkIcon, Users, BookOpen, Search, Share2, MoreVertical, Trash2, Copy, Loader2, User as UserIcon } from 'lucide-react';
import type { Post, User } from '@/lib/types';
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
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function CreatePost({ onAddPost }: { onAddPost: (newPost: Post) => void }) {
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, idToken } = useAuth();

  const handlePost = async () => {
    if (!postContent.trim() || !idToken) return;
    setLoading(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content: postContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const newPost = await response.json();
      onAddPost(newPost);
      setPostContent('');
      toast({
        title: "Post Created",
        description: "Your post is now live on the feed.",
      });

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create your post. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeoCard>
      <NeoCardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="hidden sm:block">
            <AvatarImage src={user?.avatar} data-ai-hint="user avatar" />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
              className="min-h-24 border-2 border-foreground mb-4 bg-secondary text-base"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon" disabled={loading}>
                    <LinkIcon className="h-5 w-5"/>
                </Button>
                <NeoButton onClick={handlePost} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Post
                </NeoButton>
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
      setPostUrl(`${window.location.origin}/posts/${post._id}`);
    }
  }, [post._id]);

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
            <Share2 className="h-5 w-5" /> <span className="hidden sm:inline">Share</span>
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


function PostCard({ post: initialPost, currentUser, onDelete }: { post: Post; currentUser: any; onDelete: (postId: string) => void; }) {
  const { idToken } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState((post.likes || []).includes(currentUser?.id));
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedTimestamp = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });

  const handleLike = async () => {
    if (!idToken) return;

    // Optimistic update
    const originalLikes = post.likes || [];
    const newIsLiked = !isLiked;
    
    setPost(prev => ({
        ...prev,
        likes: newIsLiked ? [...(prev.likes || []), currentUser.id] : (prev.likes || []).filter(id => id !== currentUser.id),
    }));
    setIsLiked(newIsLiked);

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      // Update with server state
      setPost(prev => ({...prev, likes: data.likes}));
      setIsLiked(data.isLiked);

    } catch (error) {
      // Revert on error
      setPost(prev => ({ ...prev, likes: originalLikes }));
      setIsLiked(!newIsLiked);
      toast({ variant: "destructive", title: "Error", description: "Could not update like." });
    }
  };
  
  const handleDelete = async () => {
    if (!idToken) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      toast({ title: "Post Deleted", description: "The post has been removed." });
      onDelete(post._id as unknown as string);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        setIsDeleting(false);
    }
  }


  return (
    <NeoCard>
      <NeoCardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.author.avatar} data-ai-hint="user avatar" />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{post.author.role} &middot; {formattedTimestamp}</p>
              </div>
            </div>
            {currentUser?.role === 'Faculty' && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" disabled={isDeleting}>
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                            <span>Delete Post</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </NeoCardHeader>
      <NeoCardContent className="px-4 sm:px-6 py-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.resourceLink && (
            <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-md border-2 border-foreground hover:bg-primary/20">
                <LinkIcon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate text-sm font-medium">{post.resourceLink}</span>
            </a>
        )}
      </NeoCardContent>
      <NeoCardFooter className="p-4 sm:p-6 pt-0">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
            <ThumbsUp className={cn("h-5 w-5", isLiked && "text-primary fill-primary")} /> {(post.likes || []).length}
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => router.push(`/posts/${post._id}`)}>
            <MessageCircle className="h-5 w-5" /> {post.commentCount || 0}
          </Button>
           <ShareDialog post={post} />
        </div>
      </NeoCardFooter>
    </NeoCard>
  );
}

function RightSidebar() {
    return (
        <aside className="hidden lg:block w-80 xl:w-96 space-y-6">
            <NeoCard>
                <NeoCardHeader className="p-4">
                    <h2 className="font-headline font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5"/> My Groups</h2>
                </NeoCardHeader>
                <NeoCardContent className="p-4 pt-0 space-y-3">
                   <p className="text-sm text-muted-foreground">You are not part of any groups yet.</p>
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

function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data.users);
      } catch (error) {
        console.error("Failed to fetch search suggestions", error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);

  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSuggestions([]);
      setQuery('');
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search users..." 
              className="pl-10 border-2 border-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            />
        </div>
        {suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-card border-2 border-foreground rounded-md shadow-lg z-20">
            <ul>
              {suggestions.map(user => (
                <li key={user.id}>
                  <Link 
                    href={`/profile/${user.id}`} 
                    className="flex items-center gap-3 p-3 hover:bg-secondary"
                    onClick={() => { setSuggestions([]); setQuery(''); }}
                  >
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.avatar} />
                       <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
    </form>
  )
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, authLoading } = useAuth();


  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError('Could not load the feed. Please try refreshing the page.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);


  const handleAddPost = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };
  
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p._id?.toString() !== postId));
  };


  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center justify-between gap-4 border-b-2 border-foreground bg-card px-4 md:px-6">
            <div className="flex-1">
                <h1 className="text-2xl font-headline font-bold">Activity Feed</h1>
            </div>
            <div className="w-full max-w-sm">
                <SearchBar />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex gap-8">
            <div className="flex-1 space-y-6">
                <CreatePost onAddPost={handleAddPost} />
                <div className="space-y-6">
                    {loading && <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>}
                    {error && <div className="text-center p-8 text-destructive">{error}</div>}
                    {!loading && !error && posts.map(post => <PostCard key={post._id?.toString()} post={post} currentUser={user} onDelete={handleDeletePost} />)}
                </div>
            </div>
            <RightSidebar />
        </main>
      </div>
    </div>
  );
}
