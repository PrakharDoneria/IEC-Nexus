
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { ChevronRight, LogOut } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <MobileNav pageTitle="Settings" />
        <header className="hidden md:flex h-16 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
            <h1 className="text-2xl font-headline font-bold">Settings</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-start justify-center">
            <div className="w-full max-w-2xl mx-auto space-y-8">
                <NeoCard>
                    <NeoCardHeader>
                        <h2 className="font-headline text-2xl font-bold">Account</h2>
                        <p className="text-muted-foreground">Manage your account and profile settings.</p>
                    </NeoCardHeader>
                    <NeoCardContent className="p-0">
                        <Link href="/settings/profile" className="flex items-center justify-between p-4 border-t-2 border-foreground hover:bg-secondary">
                            <div>
                                <h3 className="font-semibold">Profile</h3>
                                <p className="text-sm text-muted-foreground">Update your name, avatar, and other personal information.</p>
                            </div>
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    </NeoCardContent>
                </NeoCard>
                <SettingsForm />

                <div className="md:hidden">
                    <LogoutButton />
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
