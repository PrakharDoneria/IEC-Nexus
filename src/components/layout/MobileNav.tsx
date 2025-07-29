
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, MessageSquare, User, BookOpen, Settings, Code, Trophy, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


const bottomNavItems = [
  { href: '/feed', icon: LayoutDashboard, label: 'Feed' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/challenge', icon: Code, label: 'Challenge' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', requiresBadge: true },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav({ children, pageTitle }: { children?: React.ReactNode, pageTitle?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useUnreadCount();

  return (
    <>
      <header className="md:hidden sticky top-0 flex h-16 items-center justify-between border-b-2 border-foreground bg-card px-4 z-10">
        <Link href="/feed" className="flex items-center gap-2 font-headline font-semibold text-lg">
           <div className="p-1.5 bg-primary border-2 border-foreground rounded-md">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
           IEC Nexus
        </Link>
        <div className="flex items-center gap-1">
          {children}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search">
              <Search className="h-5 w-5"/>
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 border-l-2 border-foreground">
              <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Settings</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                 <p className="text-muted-foreground">This is where settings would go.</p>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </header>
       <div className="md:hidden flex h-14 items-center justify-center border-b-2 border-foreground bg-card">
         {pageTitle && <h1 className="font-headline text-xl font-bold">{pageTitle}</h1>}
       </div>


      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-foreground h-16 z-10 grid grid-cols-6 justify-around items-center">
        {bottomNavItems.map(item => {
          const href = item.href === '/profile' && user ? `/profile/${user.id}` : item.href;
          const isActive = (
            item.href === '/feed' ? pathname === item.href : pathname.startsWith(item.href)
          );
          return (
            <Link key={item.href} href={href} className={cn(
              "flex flex-col items-center justify-center gap-1 text-muted-foreground w-full h-full",
              isActive && "text-primary"
            )}>
              <div className="relative">
                <item.icon className="h-6 w-6"/>
                {item.requiresBadge && totalUnreadCount > 0 && (
                   <Badge variant="destructive" className="absolute -top-1 -right-2 px-1.5 h-auto text-xs">{totalUnreadCount}</Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}
