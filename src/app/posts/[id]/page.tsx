
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from "@/components/NeoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Post, Comment } from "@/lib/types";
import { ThumbsUp, MessageCircle, Link as LinkIcon, MoreVertical, Trash2, Loader2, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

function SinglePostCard({ post: initialPost }: { post: Post }) {
    const { user, idToken } = useAuth();
    const [post, setPost] = React.useState(initialPost);
    const [isLiked, setIsLiked] = React.useState((post.likes || []).includes(user?.id ?? ''));

     React.useEffect(() => {
        setPost(initialPost);
        setIsLiked((initialPost.likes || []).includes(user?.id ?? ''))
    }, [initialPost, user]);

     const handleLike = async () => {
        if (!idToken) return;

        const originalPost = post;
        const newIsLiked = !isLiked;
        
        // Optimistic update
        const newPost = {
            ...post,
            likes: newIsLiked 
                ? [...(post.likes || []), user!.id] 
                : (post.likes || []).filter(id => id !== user!.id)
        };
        setPost(newPost);
        setIsLiked(newIsLiked);

        try {
            const response = await fetch(`/api/posts/${post._id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` } });
            if (!response.ok) throw new Error('Failed to like post');
            const data = await response.json();
            // Sync with server state
            setPost(prev => ({ ...prev, likes: data.likes }));
            setIsLiked(data.isLiked);
        } catch (error) {
            // Revert on error
            setPost(originalPost);
            setIsLiked(!newIsLiked);
            toast({ variant: "destructive", title: "Error", description: "Could not update like." });
        }
    };
    
    if (!post || !post.author) {
        return null;
    }

    return (
        <NeoCard className="max-w-3xl mx-auto">
        <NeoCardHeader className="p-4 sm:p-6 pb-2">
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
        <NeoCardContent className="px-4 sm:px-6 py-4">
            <p className="whitespace-pre-wrap text-lg">{post.content}</p>
            {post.resourceLink && (
                <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-md border-2 border-foreground hover:bg-primary/20">
                    <LinkIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">{post.resourceLink}</span>
                </a>
            )}
        </NeoCardContent>
        <NeoCardFooter className="p-4 sm:p-6 pt-2 border-t-2 border-foreground">
            <div className="flex items-center gap-4 text-muted-foreground">
            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
                <ThumbsUp className={cn("h-5 w-5", isLiked && "text-primary fill-primary")} /> {(post.likes || []).length} Likes
            </Button>
            <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> {post.commentCount || 0} Comments
            </div>
            </div>
        </NeoCardFooter>
        </NeoCard>
    );
}

function CommentCard({ comment }: { comment: Comment }) {
    return (
        <div className="flex gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={comment.author?.avatar} />
                <AvatarFallback>{comment.author?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-secondary p-3 rounded-lg border-2 border-foreground">
                <div className="flex items-baseline gap-2">
                    <p className="font-bold">{comment.author?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                </div>
                <p className="mt-1">{comment.content}</p>
            </div>
        </div>
    )
}

function CommentSection({ postId, onCommentAdded }: { postId: string, onCommentAdded: () => void }) {
    const { user, idToken } = useAuth();
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [commentText, setCommentText] = React.useState("");
    const [posting, setPosting] = React.useState(false);

    React.useEffect(() => {
        const fetchComments = async () => {
            setLoading(true);
            const res = await fetch(`/api/posts/${postId}/comments`);
            const data = await res.json();
            setComments(data);
            setLoading(false);
        };
        fetchComments();
    }, [postId]);

    const handlePostComment = async () => {
        if (!commentText.trim() || !idToken) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ content: commentText })
            });
            if (!res.ok) throw new Error("Failed to post comment");
            const newComment = await res.json();
            setComments(prev => [...prev, newComment]);
            setCommentText("");
            onCommentAdded();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not post your comment."});
        } finally {
            setPosting(false);
        }
    };
    
    return (
        <div className="max-w-3xl mx-auto mt-6">
            <h2 className="font-headline text-2xl font-bold mb-4">Comments</h2>
            {user && (
                <div className="flex gap-3 mb-6">
                    <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                        <Textarea placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="border-2 border-foreground" />
                        <Button size="icon" onClick={handlePostComment} disabled={posting}>
                            {posting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                {loading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
                {!loading && comments.length === 0 && <p className="text-muted-foreground text-center">No comments yet. Be the first!</p>}
                {!loading && comments.map(c => <CommentCard key={c._id?.toString()} comment={c} />)}
            </div>
        </div>
    )
}

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPost = React.useCallback(async () => {
    if (postId) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error('Post not found');
        }
        const data = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [postId]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handlePostUpdate = () => {
      fetchPost();
  }

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
                    <CommentSection postId={postId} onCommentAdded={handlePostUpdate}/>
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
