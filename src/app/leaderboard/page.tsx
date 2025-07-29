
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { User } from '@/lib/types';
import { Loader2, Trophy, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NeoCard, NeoCardContent, NeoCardHeader } from '@/components/NeoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

function LeaderboardRow({ user, rank }: { user: User; rank: number }) {
  const rankColors = [
    'text-yellow-500', // 1st
    'text-gray-400',  // 2nd
    'text-yellow-700',  // 3rd
  ];

  return (
    <NeoCard>
      <NeoCardContent className="p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8">
            {rank < 3 ? (
              <Trophy className={`h-6 w-6 ${rankColors[rank]}`} />
            ) : (
              <span className="font-bold text-lg text-muted-foreground">{rank + 1}</span>
            )}
          </div>
          <Avatar className="h-12 w-12 border-2 border-foreground">
            <AvatarImage src={user.avatar} data-ai-hint="user avatar" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Link href={`/profile/${user.id}`} className="font-bold hover:underline">
              {user.name}
            </Link>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
          <div className="flex items-center gap-2 font-bold text-lg">
             <Award className="h-5 w-5 text-primary" />
            <span>{user.score || 0}</span>
          </div>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load leaderboard.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary"/>
            Leaderboard
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-4">
                {loading && (
                    <div className="flex justify-center mt-8">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                )}
                {error && <p className="text-center text-destructive mt-8">{error}</p>}
                {!loading && !error && leaderboard.map((user, index) => (
                    <LeaderboardRow key={user.id} user={user} rank={index} />
                ))}
                 {!loading && !error && leaderboard.length === 0 && (
                    <NeoCard>
                        <NeoCardContent className="p-8 text-center">
                            <p className="text-muted-foreground">The leaderboard is empty. Solve some challenges to get on the board!</p>
                        </NeoCardContent>
                    </NeoCard>
                 )}
            </div>
        </main>
      </div>
    </div>
  );
}
