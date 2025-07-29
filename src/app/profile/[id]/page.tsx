
"use client";

import * as React from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Briefcase, GraduationCap, UserPlus, UserCheck, ShieldBan, Loader2, Edit, MessageSquare } from "lucide-react";
import { Post, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
    const { user, idToken, authLoading, refreshUser } = useAuth();
    const [isFollowing, setIsFollowing] = React.useState(user?.following?.includes(profileUser.id) ?? false);
    const [loading, setLoading] = React.useState(false);
    
    React.useEffect(() => {
       if (user?.following) {
         setIsFollowing(user.following.includes(profileUser.id));
       }
    }, [user, profileUser.id])

    const handleFollow = async () => {
        if (!idToken) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to follow users." });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${profileUser.id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setIsFollowing(data.isFollowing);
            await refreshUser(); // Refresh current user's following list
            
        } catch(error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) return <NeoButton disabled><Loader2 className="h-4 w-4 animate-spin"/></NeoButton>;

    return (
        <NeoButton onClick={handleFollow} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isFollowing ? 'Following' : 'Follow'}
        </NeoButton>
    )
}

function BanButton({ profileUser, onBan }: { profileUser: User; onBan: () => void }) {
    const { idToken } = useAuth();
    const [loading, setLoading] = React.useState(false);

    const handleBan = async () => {
        if (!idToken) return;
        if (!confirm(`Are you sure you want to ban ${profileUser.name}? This action cannot be undone.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/users/${profileUser.id}/ban`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
             const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to ban user.");
            toast({ title: "User Banned", description: `${profileUser.name} has been banned.`});
            onBan();

        } catch(error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <NeoButton variant="destructive" onClick={handleBan} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldBan className="mr-2 h-4 w-4" />}
            Ban User
        </NeoButton>
    )
}

function MessageButton({ profileUser }: { profileUser: User }) {
    const router = useRouter();

    const handleMessage = () => {
        router.push(`/messages?recipient=${profileUser.id}`);
    }

    return (
        <NeoButton variant="secondary" onClick={handleMessage}>
            <MessageSquare className="mr-2 h-4 w-4"/>
            Message
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
  

  const fetchProfile = React.useCallback(async () => {
        if (profileId) {
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

            } catch (err: any) {
                setError(err.message || 'Could not load profile.');
            } finally {
                setLoading(false);
            }
        }
  }, [profileId]);


  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleUserBanned = () => {
    setProfileUser(prev => prev ? { ...prev, isBanned: true } : null);
  };


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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                 <h2 className="text-2xl font-bold font-headline">Profile Not Found</h2>
                 <p className="text-destructive mt-2">{error || "The user you are looking for does not exist."}</p>
              </div>
           </div>
      )
  }
  
  if (profileUser.isBanned) {
      return (
           <div className="flex min-h-screen bg-background">
              <AppSidebar />
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                 <ShieldBan className="h-16 w-16 text-destructive mb-4" />
                 <h2 className="text-2xl font-bold font-headline">User Banned</h2>
                 <p className="text-muted-foreground mt-2">This user's account has been suspended.</p>
              </div>
           </div>
      )
  }


  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1">
          {/* Cover Photo */}
          <div className="h-32 sm:h-48 bg-primary border-b-2 border-foreground relative">
             <Avatar className="h-24 w-24 sm:h-32 sm:w-32 absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8 border-4 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <AvatarImage src={profileUser.avatar} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl">{profileUser.name.slice(0,2)}</AvatarFallback>
             </Avatar>
          </div>
          {/* Profile Header */}
          <div className="bg-card border-b-2 border-foreground px-4 sm:px-8 pt-16 sm:pt-20 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
              <div className="flex-1">
                  <h1 className="font-headline text-3xl sm:text-4xl font-bold">{profileUser.name}</h1>
                  <p className="text-muted-foreground text-base sm:text-lg">@{profileUser.name.toLowerCase().replace(' ', '').replace('.', '')}</p>
                   <p className="mt-2 text-base">{profileUser.bio}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                      <span className="font-bold">{profileUser.following?.length || 0}</span> Following
                      <span className="font-bold">{profileUser.followers?.length || 0}</span> Followers
                  </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <NeoButton asChild variant="secondary">
                     <Link href="/settings/profile"><Edit className="mr-2 h-4 w-4"/> Edit Profile</Link>
                  </NeoButton>
                ) : (
                    <>
                        <FollowButton profileUser={profileUser} />
                        <MessageButton profileUser={profileUser} />
                    </>
                )}
                 {currentUser?.role === 'Faculty' && !isOwnProfile && (
                        <BanButton profileUser={profileUser} onBan={handleUserBanned}/>
                  )}
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="p-4 sm:p-8 grid md:grid-cols-3 gap-8">
            {/* Left Column (About) */}
            <div className="md:col-span-1 space-y-6">
                <NeoCard>
                    <NeoCardHeader className="p-4">
                        <h2 className="font-headline font-bold text-xl">About</h2>
                    </NeoCardHeader>
                    <NeoCardContent className="space-y-3 p-4 pt-0">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <span>{profileUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {profileUser.role === 'Faculty' ? (
                                <Briefcase className="h-5 w-5 text-muted-foreground"/>
                            ) : (
                                <GraduationCap className="h-5 w-5 text-muted-foreground"/>
                            )}
                            <span>{profileUser.bio || "At IEC"}</span>
                        </div>
                    </NeoCardContent>
                </NeoCard>
            </div>
            {/* Right Column (Posts) */}
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
