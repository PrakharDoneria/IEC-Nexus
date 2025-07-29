
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from "@/components/NeoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Post } from "@/lib/types";
import { ThumbsUp, MessageCircle, Link as LinkIcon, MoreVertical, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

function SinglePostCard({ post }: { post: Post }) {
    const { user } = useAuth();
    
    if (!post || !post.author) {
        return null;
    }

    return (
        <NeoCard className="max-w-3xl mx-auto">
        <NeoCardHeader className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={post.author.avatar} data-ai-hint="user avatar" />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold">{post.author.name}</p>
                    <p className="text-sm text-muted-foreground">{post.author.role} &middot; {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                </div>
                </div>
                {user?.role === 'Faculty' && (
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
            <p className="whitespace-pre-wrap text-lg">{post.content}</p>
            {post.resourceLink && (
                <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-md border-2 border-foreground hover:bg-primary/20">
                    <LinkIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">{post.resourceLink}</span>
                </a>
            )}
        </NeoCardContent>
        <NeoCardFooter className="p-4 pt-0">
            <div className="flex items-center gap-4 text-muted-foreground">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" /> {post.likes}
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> {post.comments}
            </Button>
            </div>
        </NeoCardFooter>
        </NeoCard>
    );
}


export default function PostPage() {
  const params = useParams();
  const postId = params.id;
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (postId) {
      const fetchPost = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/posts/${postId}`);
          if (!res.ok) {
            throw new Error('Post not found');
          }
          const data = await res.json();
          setPost(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [postId]);

  const renderContent = () => {
    if (loading) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }
    if (error) {
        return (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-headline text-3xl font-bold">Post not found</h1>
                    <p className="text-muted-foreground mt-2">The post you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }
    if (post) {
        return (
            <>
                <header className="hidden md:flex h-16 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
                    <h1 className="text-2xl font-headline font-bold">Post Details</h1>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <SinglePostCard post={post} />
                </main>
            </>
        );
    }
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        {renderContent()}
      </div>
    </div>
  );
}
