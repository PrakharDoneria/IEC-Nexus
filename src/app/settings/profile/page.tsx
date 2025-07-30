
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardFooter } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MAX_AVATAR_SIZE_MB = 5; // Increased limit for better quality

export default function EditProfilePage() {
  const { user, idToken, authLoading, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setAvatar(user.avatar);
    }
  }, [user]);

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
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_AVATAR_SIZE_MB}MB.`
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(URL.createObjectURL(file)); // For preview
        setAvatarData(reader.result as string); // For upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setLoading(true);
    
    const updatePayload: {name: string, bio: string, avatar?: string} = { name, bio };
    if (avatarData) {
        updatePayload.avatar = avatarData;
    }
    
    try {
       const res = await fetch(`/api/users/current`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      await refreshUser();
      setAvatar(updatedUser.avatar); // Update preview with the new Cloudinary URL
      setAvatarData(null); // Clear upload data
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully."
      });

    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message
        });
    } finally {
      setLoading(false);
    }
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
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/png, image/jpeg"
                        className="hidden"
                      />
                      <NeoButton type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
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
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="border-2 border-foreground"
                      placeholder="Tell us a bit about yourself"
                      maxLength={150}
                    />
                    <p className="text-xs text-muted-foreground text-right">{bio.length} / 150</p>
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
