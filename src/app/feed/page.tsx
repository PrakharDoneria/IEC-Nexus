import Image from 'next/image';
import Link from 'next/link';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from '@/components/NeoCard';
import { NeoButton } from '@/components/NeoButton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Link as LinkIcon, Users, BookOpen, Search } from 'lucide-react';
import { mockPosts, mockGroups } from '@/lib/mock';
import type { Post } from '@/lib/types';
import { Input } from '@/components/ui/input';

function CreatePost() {
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
            />
            <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon">
                    <LinkIcon className="h-5 w-5"/>
                </Button>
                <NeoButton>Post</NeoButton>
            </div>
          </div>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <NeoCard>
      <NeoCardHeader className="p-4">
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
                <CreatePost />
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
