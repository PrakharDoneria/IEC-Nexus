import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUsers, mockPosts } from "@/lib/mock";
import { Mail, Briefcase, GraduationCap } from "lucide-react";
import { Post } from "@/lib/types";

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

export default function ProfilePage() {
  // Using the first faculty member for demonstration
  const user = mockUsers[1]; 
  const userPosts = mockPosts.filter(p => p.author.id === user.id);

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
            </div>
            <NeoButton variant="secondary">Edit Profile</NeoButton>
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
