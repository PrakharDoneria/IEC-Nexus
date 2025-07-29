import Image from "next/image";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NeoCard, NeoCardContent, NeoCardFooter, NeoCardHeader } from "@/components/NeoCard";
import { NeoButton } from "@/components/NeoButton";
import { mockGroups } from "@/lib/mock";
import type { Group } from "@/lib/types";
import { Plus, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";


function GroupCard({ group }: { group: Group }) {
    return (
        <NeoCard className="overflow-hidden">
            <div className="h-32 bg-secondary border-b-2 border-foreground">
                <Image src={group.coverImage} alt={`${group.name} cover`} width={400} height={150} className="w-full h-full object-cover" data-ai-hint="group cover"/>
            </div>
            <NeoCardHeader className="p-4">
                <h3 className="font-headline text-xl font-bold">{group.name}</h3>
                <p className="text-sm text-muted-foreground h-10">{group.description}</p>
            </NeoCardHeader>
            <NeoCardFooter className="p-4 pt-2 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{group.memberCount} members</span>
                <NeoButton size="sm">View</NeoButton>
            </NeoCardFooter>
        </NeoCard>
    )
}

function JoinGroupDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <NeoButton variant="secondary"><LogIn className="mr-2 h-4 w-4" /> Join Group</NeoButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <DialogHeader>
                    <DialogTitle className="font-headline">Join a Group</DialogTitle>
                    <DialogDescription>
                        Enter the invite code to join an existing group.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">
                            Invite Code
                        </Label>
                        <Input id="code" placeholder="abc-123" className="col-span-3 border-2 border-foreground" />
                    </div>
                </div>
                <DialogFooter>
                    <NeoButton type="submit">Join</NeoButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CreateGroupDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <NeoButton><Plus className="mr-2 h-4 w-4" /> Create Group</NeoButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <DialogHeader>
                    <DialogTitle className="font-headline">Create a New Group</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create your own collaboration space.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input id="name" placeholder="e.g., AI & Machine Learning Club" className="border-2 border-foreground" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" placeholder="A short description of your group" className="border-2 border-foreground" />
                    </div>
                </div>
                <DialogFooter>
                    <NeoButton type="submit">Create</NeoButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GroupsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="flex h-16 items-center justify-between border-b-2 border-foreground bg-card px-4 md:px-6">
            <h1 className="text-2xl font-headline font-bold">Groups</h1>
            <div className="flex items-center gap-4">
                <JoinGroupDialog />
                <CreateGroupDialog />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockGroups.map(group => <GroupCard key={group.id} group={group} />)}
            </div>
        </main>
      </div>
    </div>
  );
}
