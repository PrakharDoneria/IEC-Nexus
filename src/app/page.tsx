
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/feed');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col items-center justify-center text-center">
        <div className="mb-8 p-4 bg-primary border-2 border-foreground rounded-full">
          <Users className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-foreground">
          IEC Nexus
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          The exclusive social media platform for IEC-CET students and faculty. Connect, collaborate, and share.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="font-bold border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="font-bold border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </main>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} IEC Nexus. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
