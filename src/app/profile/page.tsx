
"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUsers, mockPosts } from "@/lib/mock";
import { Mail, Briefcase, GraduationCap, UserPlus, UserCheck, ShieldBan } from "lucide-react";
import { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";

function ProfilePostCard({ post }: { post: Post }) {
  return (
    <NeoCard>
      <NeoCardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">{new Date().toLocaleDateString()}</p>
        <p>{post.content}</p>
      </NeoCardContent>
    </NeoCard>
  )
}

function FollowButton() {
    // Mock state for following
    const [isFollowing, setIsFollowing] = React.useState(false);

    return (
        <NeoButton onClick={() => setIsFollowing(!isFollowing)}>
            {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isFollowing ? 'Following' : 'Follow'}
        </NeoButton>
    )
}

export default function ProfilePage() {
  // Using a faculty member for viewing profile, and a student as current user
  const user = mockUsers[1]; 
  const userPosts = mockPosts.filter(p => p.author.id === user.id);
  const currentUser = mockUsers[0];
  const viewingAsFaculty = mockUsers[1].role === 'Faculty'; // Check if viewer is faculty

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1">
          <div className="h-48 bg-primary border-b-2 border-foreground relative">
             <Avatar className="h-32 w-32 absolute -bottom-16 left-8 border-4 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <AvatarImage src={user.avatar} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl">{user.name.slice(0,2)}</AvatarFallback>
             </Avatar>
          </div>
          <div className="bg-card border-b-2 border-foreground px-8 pt-20 pb-6 flex justify-between items-start">
            <div>
                <h1 className="font-headline text-4xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground text-lg">@{user.name.toLowerCase().replace(' ', '').replace('.', '')}</p>
                <div className="flex gap-4 mt-2 text-sm">
                    <span className="font-bold">120</span> Following
                    <span className="font-bold">85</span> Followers
                </div>
            </div>
            {currentUser.id === user.id ? (
              <NeoButton variant="secondary">Edit Profile</NeoButton>
            ) : (
                <div className="flex gap-2">
                    <FollowButton />
                    <NeoButton variant="secondary">Message</NeoButton>
                    {viewingAsFaculty && (
                         <NeoButton variant="destructive">
                            <ShieldBan className="mr-2 h-4 w-4" />
                            Ban User
                        </NeoButton>
                    )}
                </div>
            )}
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <NeoCard>
                    <NeoCardHeader>
                        <h2 className="font-headline font-bold text-xl">About</h2>
                    </NeoCardHeader>
                    <NeoCardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <span>{user.email}</span>
                        </div>
                        {user.role === 'Faculty' ? (
                             <div className="flex items-center gap-3">
                                <Briefcase className="h-5 w-5 text-muted-foreground"/>
                                <span>Professor, Computer Science</span>
                            </div>
                        ) : (
                             <div className="flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground"/>
                                <span>B.Tech CSE, 3rd Year</span>
                            </div>
                        )}
                       
                    </NeoCardContent>
                </NeoCard>
            </div>
            <div className="md:col-span-2 space-y-6">
                <h2 className="font-headline font-bold text-2xl">Posts</h2>
                 {userPosts.length > 0 ? (
                    userPosts.map(post => <ProfilePostCard key={post.id} post={post} />)
                ) : (
                    <NeoCard>
                      <NeoCardContent className="p-6 text-center text-muted-foreground">
                        This user hasn't posted anything yet.
                      </NeoCardContent>
                    </NeoCard>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
