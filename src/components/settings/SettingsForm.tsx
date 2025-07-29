"use client";

import { useState } from "react";
import { NeoButton } from "@/components/NeoButton";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/lib/types";
import { BellDot, Loader2, CheckCircle } from "lucide-react";

export function SettingsForm() {
  const [settings, setSettings] = useState<NotificationSettings>({
    newFollower: true,
    postLike: true,
    postComment: false,
    groupInvite: true,
    directMessage: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Saved settings:", settings);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <NeoCard>
          <NeoCardHeader>
            <div className="flex items-center gap-4">
                 <BellDot className="h-8 w-8 text-primary" />
                <div>
                    <h2 className="font-headline text-2xl font-bold">
                        Notification Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Manage what activities you get notified about.
                    </p>
                </div>
            </div>
          </NeoCardHeader>
          <NeoCardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border-2 border-foreground p-4">
              <Label htmlFor="newFollower" className="font-semibold">
                New Follower
              </Label>
              <Switch
                id="newFollower"
                checked={settings.newFollower}
                onCheckedChange={() => handleToggle("newFollower")}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-foreground p-4">
              <Label htmlFor="postLike" className="font-semibold">
                Post Like
              </Label>
              <Switch
                id="postLike"
                checked={settings.postLike}
                onCheckedChange={() => handleToggle("postLike")}
              />
            </div>
             <div className="flex items-center justify-between rounded-lg border-2 border-foreground p-4">
              <Label htmlFor="postComment" className="font-semibold">
                Post Comment
              </Label>
              <Switch
                id="postComment"
                checked={settings.postComment}
                onCheckedChange={() => handleToggle("postComment")}
              />
            </div>
             <div className="flex items-center justify-between rounded-lg border-2 border-foreground p-4">
              <Label htmlFor="groupInvite" className="font-semibold">
                Group Invite
              </Label>
              <Switch
                id="groupInvite"
                checked={settings.groupInvite}
                onCheckedChange={() => handleToggle("groupInvite")}
              />
            </div>
             <div className="flex items-center justify-between rounded-lg border-2 border-foreground p-4">
              <Label htmlFor="directMessage" className="font-semibold">
                Direct Message
              </Label>
              <Switch
                id="directMessage"
                checked={settings.directMessage}
                onCheckedChange={() => handleToggle("directMessage")}
              />
            </div>

            <div className="flex justify-end">
                 <NeoButton type="submit" disabled={loading || saved}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Saved!
                        </>
                    ) : (
                        "Save Preferences"
                    )}
                </NeoButton>
            </div>
          </NeoCardContent>
        </NeoCard>
      </form>
    </div>
  );
}
