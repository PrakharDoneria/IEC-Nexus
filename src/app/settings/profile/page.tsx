
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateProfileBanner } from "@/ai/flows/generate-profile-banner";

const MAX_AVATAR_SIZE_MB = 5; 

export default function EditProfilePage() {
  const { user, idToken, authLoading, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState("");
  const [bannerSearchQuery, setBannerSearchQuery] = useState("");
  const [isSearchingBanner, setIsSearchingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setAvatar(user.avatar);
      setBannerImage(user.bannerImage || 'https://placehold.co/1200x300.png');
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

  const handleBannerSearch = async () => {
    if (!bannerSearchQuery.trim()) return;
    setIsSearchingBanner(true);
    try {
        const result = await generateProfileBanner({ query: bannerSearchQuery });
        setBannerImage(result.imageUrl);
    } catch (error) {
        toast({ variant: "destructive", title: "Banner Search Failed", description: "Could not fetch an image. Please try another query." });
    } finally {
        setIsSearchingBanner(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setLoading(true);
    
    const updatePayload: {name: string, bio: string, avatar?: string, bannerImage?: string} = { name, bio, bannerImage };
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
      setAvatar(updatedUser.avatar); 
      setBannerImage(updatedUser.bannerImage);
      setAvatarData(null);
      
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
        <header className="hidden md:flex h-16 items-center border-b bg-card px-4 md:px-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-3xl">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">Public Profile</h2>
                  <p className="text-muted-foreground">
                    This information will be visible to others on the platform.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8 p-6">
                   <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <div className="w-full aspect-[16/5] bg-secondary rounded-lg overflow-hidden relative">
                             {bannerImage && <Image src={bannerImage} alt="Banner preview" layout="fill" objectFit="cover" />}
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Search for a banner (e.g. 'abstract background')"
                                value={bannerSearchQuery}
                                onChange={(e) => setBannerSearchQuery(e.target.value)}
                            />
                            <Button type="button" onClick={handleBannerSearch} disabled={isSearchingBanner}>
                                {isSearchingBanner ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            </Button>
                        </div>
                   </div>
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatar} data-ai-hint="user avatar" />
                        <AvatarFallback className="text-3xl">{name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/png, image/jpeg"
                        className="hidden"
                      />
                      <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Change Avatar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
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
                      className="bg-muted/50"
                    />
                     <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end p-4 border-t">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
