
"use client";

import * as React from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Briefcase, GraduationCap, UserPlus, UserCheck, ShieldBan, Loader2, Edit, MessageSquare, Award, Link as LinkIcon } from "lucide-react";
import { Post, User } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";

function ProfilePostCard({ post }: { post: Post }) {
  return (
    <NeoCard>
        <NeoCardHeader className="flex flex-row items-center gap-3">
             <Avatar className="h-11 w-11">
                <AvatarImage src={post.author.avatar} data-ai-hint="user avatar" />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
              </div>
        </NeoCardHeader>
      <NeoCardContent className="pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.resourceLink && (
            post.resourceLink.includes('stackblitz.com') ? (
                <div className="mt-4 w-full aspect-[4/3] border rounded-md overflow-hidden">
                    <iframe
                      src={post.resourceLink}
                      className="w-full h-full"
                      title="StackBlitz Code Embed"
                      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                    ></iframe>
                </div>
            ) : (
                <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-md border hover:bg-primary/20">
                    <LinkIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">{post.resourceLink}</span>
                </a>
            )
        )}
      </NeoCardContent>
    </NeoCard>
  )
}

function FollowButton({ profileUser, onFollowToggle }: { profileUser: User, onFollowToggle: (isFollowing: boolean) => void }) {
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
            onFollowToggle(data.isFollowing); // Callback to update profile page state
            await refreshUser(); // Refresh current user's following list

        } catch(error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    }

    if (authLoading) return <Button disabled><Loader2 className="h-4 w-4 animate-spin"/></Button>;

    return (
        <Button onClick={handleFollow} disabled={loading} variant={isFollowing ? 'secondary' : 'default'}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
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
        <Button variant="destructive" onClick={handleBan} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldBan className="mr-2 h-4 w-4" />}
            Ban User
        </Button>
    )
}

function MessageButton({ profileUser }: { profileUser: User }) {
    const router = useRouter();

    const handleMessage = () => {
        router.push(`/messages?recipient=${profileUser.id}`);
    }

    return (
        <Button variant="secondary" onClick={handleMessage}>
            <MessageSquare className="mr-2 h-4 w-4"/>
            Message
        </Button>
    )
}

function FollowListDialog({ userList, title }: { userList: User[], title: string }) {
    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72">
                <div className="space-y-4 pr-6">
                    {userList.length > 0 ? userList.map(user => (
                        <div key={user.id} className="flex items-center justify-between">
                            <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:underline">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                </div>
                            </Link>
                        </div>
                    )) : (
                        <p className="text-muted-foreground text-center pt-4">This list is empty.</p>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
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
                const userRes = await fetch(`/api/users/${profileId}?populate=followers,following`);
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

   const handleFollowToggle = React.useCallback((isFollowing: boolean) => {
        setProfileUser(prev => {
            if (!prev || !currentUser) return prev;

            const currentFollowers = (prev.followers || []) as User[];
            let newFollowers;

            if (isFollowing) {
                // Add current user to followers list if not already present
                if (!currentFollowers.some(u => u.id === currentUser.id)) {
                    newFollowers = [...currentFollowers, {id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, role: currentUser.role, email: currentUser.email, bannerImage: currentUser.bannerImage}];
                } else {
                    newFollowers = currentFollowers;
                }
            } else {
                // Remove current user from followers list
                newFollowers = currentFollowers.filter(u => u.id !== currentUser.id);
            }

            return { ...prev, followers: newFollowers };
        });
    }, [currentUser]);


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
                 <h2 className="text-2xl font-bold">Profile Not Found</h2>
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
                 <h2 className="text-2xl font-bold">User Banned</h2>
                 <p className="text-muted-foreground mt-2">This user's account has been suspended.</p>
              </div>
           </div>
      )
  }


  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <MobileNav />
        <main className="flex-1">
          <div className="w-full bg-card">
            <div className="h-32 sm:h-48 bg-secondary relative">
                <Image
                    src={profileUser.bannerImage || 'https://placehold.co/1200x300.png'}
                    alt="Cover image"
                    width={1200}
                    height={300}
                    className="w-full h-full object-cover"
                    data-ai-hint="header abstract"
                />
            </div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-card">
                           <AvatarImage src={profileUser.avatar} data-ai-hint="user avatar" />
                           <AvatarFallback className="text-4xl">{profileUser.name.slice(0,2)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="sm:hidden 2xl:block mt-6 min-w-0 flex-1">
                            <h1 className="text-2xl font-bold text-foreground truncate">{profileUser.name}</h1>
                            <p className="text-sm text-muted-foreground">@{profileUser.name.toLowerCase().replace(' ', '').replace('.', '')}</p>
                        </div>
                        <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                            {isOwnProfile ? (
                              <Button asChild>
                                 <Link href="/settings/profile"><Edit className="mr-2 h-4 w-4"/> Edit Profile</Link>
                              </Button>
                            ) : (
                                <>
                                    <MessageButton profileUser={profileUser} />
                                    <FollowButton profileUser={profileUser} onFollowToggle={handleFollowToggle} />
                                </>
                            )}
                             {currentUser?.role === 'Faculty' && !isOwnProfile && (
                                    <BanButton profileUser={profileUser} onBan={handleUserBanned}/>
                              )}
                        </div>
                    </div>
                </div>
                 <div className="hidden sm:block 2xl:hidden mt-6 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-foreground truncate">{profileUser.name}</h1>
                    <p className="text-sm text-muted-foreground">@{profileUser.name.toLowerCase().replace(' ', '').replace('.', '')}</p>
                </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="max-w-5xl mx-auto p-4 sm:p-8 grid md:grid-cols-3 gap-8">
            {/* Left Column (About) */}
            <div className="md:col-span-1 space-y-6">
                <NeoCard>
                    <NeoCardHeader>
                        <h2 className="font-bold text-xl">About</h2>
                    </NeoCardHeader>
                    <NeoCardContent className="space-y-3 text-sm">
                       <p>{profileUser.bio || "At IEC"}</p>
                       <div className="flex items-center gap-3 pt-2">
                            <Mail className="h-4 w-4 text-muted-foreground"/>
                            <span className="text-muted-foreground">{profileUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {profileUser.role === 'Faculty' ? (
                                <Briefcase className="h-4 w-4 text-muted-foreground"/>
                            ) : (
                                <GraduationCap className="h-4 w-4 text-muted-foreground"/>
                            )}
                            <span className="text-muted-foreground">{profileUser.role}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Award className="h-4 w-4 text-muted-foreground"/>
                            <span className="text-muted-foreground">{profileUser.score || 0} Points</span>
                        </div>
                         <div className="flex gap-4 pt-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="hover:underline">
                                        <span className="font-bold">{(profileUser.following as User[])?.length || 0}</span> Following
                                    </button>
                                </DialogTrigger>
                                <FollowListDialog userList={profileUser.following as User[] || []} title="Following"/>
                            </Dialog>
                             <Dialog>
                                <DialogTrigger asChild>
                                   <button className="hover:underline">
                                        <span className="font-bold">{(profileUser.followers as User[])?.length || 0}</span> Followers
                                    </button>
                                </DialogTrigger>
                                <FollowListDialog userList={profileUser.followers as User[] || []} title="Followers"/>
                            </Dialog>
                          </div>
                    </NeoCardContent>
                </NeoCard>
            </div>
            {/* Right Column (Posts) */}
            <div className="md:col-span-2 space-y-6">
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
