
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardFooter } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";

export default function EditProfilePage() {
  const { user, authLoading } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </div>
    );
  }

  const handleAvatarChange = () => {
    // This would typically open a file picker
    alert("Avatar changing functionality is not implemented yet.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Updating profile...", { name, avatar });
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert("Profile updated successfully! (Simulation)");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
          <h1 className="text-2xl font-headline font-bold">Edit Profile</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit}>
              <NeoCard>
                <NeoCardHeader>
                  <h2 className="font-headline text-2xl font-bold">Public Profile</h2>
                  <p className="text-muted-foreground">
                    This information will be visible to others on the platform.
                  </p>
                </NeoCardHeader>
                <NeoCardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 border-2 border-foreground">
                        <AvatarImage src={avatar} data-ai-hint="user avatar" />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <NeoButton type="button" variant="secondary" onClick={handleAvatarChange}>
                        <Camera className="mr-2 h-4 w-4" />
                        Change Avatar
                      </NeoButton>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-2 border-foreground"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="border-2 border-foreground bg-muted/50"
                    />
                     <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                  </div>
                </NeoCardContent>
                <NeoCardFooter className="flex justify-end p-4">
                  <NeoButton type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </NeoButton>
                </NeoCardFooter>
              </NeoCard>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
