
"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Briefcase, GraduationCap, UserPlus, UserCheck, ShieldBan, Loader2 } from "lucide-react";
import { Post, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

function ProfilePostCard({ post }: { post: Post }) {
  return (
    <NeoCard>
      <NeoCardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-2">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
        <p>{post.content}</p>
      </NeoCardContent>
    </NeoCard>
  )
}

function FollowButton({ profileUser }: { profileUser: User }) {
    const { user, idToken } = useAuth();
    const [isFollowing, setIsFollowing] = React.useState(user?.following?.includes(profileUser.id));
    const [loading, setLoading] = React.useState(false);

    const handleFollow = async () => {
        setLoading(true);
        // Add API call logic here
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsFollowing(!isFollowing);
        setLoading(false);
    }

    return (
        <NeoButton onClick={handleFollow} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isFollowing ? 'Following' : 'Follow'}
        </NeoButton>
    )
}

export default function ProfilePage() {
  const { user: currentUser, authLoading } = useAuth();
  const params = useParams();
  const profileId = params.id as string;

  const [profileUser, setProfileUser] = React.useState<User | null>(null);
  const [userPosts, setUserPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  

  React.useEffect(() => {
    if (profileId) {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch profile user data
                const userRes = await fetch(`/api/users/${profileId}`);
                if (!userRes.ok) throw new Error('Failed to fetch user profile');
                const userData = await userRes.json();
                setProfileUser(userData);

                // Fetch user's posts
                const postsRes = await fetch(`/api/users/${profileId}/posts`);
                if (!postsRes.ok) throw new Error("Failed to fetch user's posts");
                const postsData = await postsRes.json();
                setUserPosts(postsData.posts);

            } catch (err) {
                setError(err.message || 'Could not load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }
  }, [profileId]);


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

  if (error || !profileUser) {
      return (
           <div className="flex min-h-screen bg-background">
              <AppSidebar />
              <div className="flex-1 flex flex-col items-center justify-center">
                 <p className="text-destructive">{error || "Profile not found."}</p>
              </div>
           </div>
      )
  }


  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1">
          <div className="h-48 bg-primary border-b-2 border-foreground relative">
             <Avatar className="h-32 w-32 absolute -bottom-16 left-8 border-4 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <AvatarImage src={profileUser.avatar} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl">{profileUser.name.slice(0,2)}</AvatarFallback>
             </Avatar>
          </div>
          <div className="bg-card border-b-2 border-foreground px-8 pt-20 pb-6 flex justify-between items-start">
            <div>
                <h1 className="font-headline text-4xl font-bold">{profileUser.name}</h1>
                <p className="text-muted-foreground text-lg">@{profileUser.name.toLowerCase().replace(' ', '').replace('.', '')}</p>
                <div className="flex gap-4 mt-2 text-sm">
                    <span className="font-bold">{profileUser.following?.length || 0}</span> Following
                    <span className="font-bold">{profileUser.followers?.length || 0}</span> Followers
                </div>
            </div>
            {currentUser?.id === profileUser.id ? (
              <NeoButton variant="secondary">Edit Profile</NeoButton>
            ) : (
                <div className="flex gap-2">
                    <FollowButton profileUser={profileUser} />
                    <NeoButton variant="secondary">Message</NeoButton>
                    {currentUser?.role === 'Faculty' && (
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
                            <span>{profileUser.email}</span>
                        </div>
                        {profileUser.role === 'Faculty' ? (
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
                    userPosts.map(post => <ProfilePostCard key={post._id?.toString()} post={post} />)
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
