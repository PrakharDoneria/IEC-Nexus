
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { User, Post, Group } from '@/lib/types';
import { Loader2, Search as SearchIcon, Users, FileText, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function UserResultCard({ user }: { user: User }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={`/profile/${user.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<{ users: User[] }>({ users: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchResults = async () => {
      if (!initialQuery) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(initialQuery)}`);
        if (!res.ok) throw new Error('Failed to fetch search results.');
        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const renderResults = () => {
    if (loading) {
      return <div className="flex justify-center mt-8"><Loader2 className="h-10 w-10 animate-spin"/></div>;
    }
    if (error) {
      return <p className="text-center text-destructive mt-8">{error}</p>;
    }
    if (!results.users.length) {
      return <p className="text-center text-muted-foreground mt-8">No results found for "{initialQuery}".</p>;
    }
    return (
      <div className="space-y-4">
        {results.users.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><UserIcon className="h-5 w-5"/> Users</h2>
            <div className="space-y-3">
              {results.users.map(user => <UserResultCard key={user.id} user={user} />)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="flex h-16 items-center border-b bg-card px-4 md:px-6">
          <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for users, posts, or groups..."
                className="pl-10 text-base"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                {initialQuery && <h1 className="text-2xl font-bold mb-6">Search results for <span className="text-primary">"{initialQuery}"</span></h1>}
                {renderResults()}
            </div>
        </main>
      </div>
    </div>
  );
}
