'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Users, LayoutDashboard, MessageSquare, User, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', icon: LayoutDashboard, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/resources', icon: BookOpen, label: 'Resources' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 flex h-16 items-center gap-4 border-b-2 border-foreground bg-card px-4 md:px-6 z-10">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/feed" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <div className="p-2 bg-primary border-2 border-foreground rounded-md">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-headline">IEC Nexus</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                  pathname.startsWith(item.href) && 'text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
       <Link href="/feed" className="flex items-center gap-2 font-headline font-semibold text-lg">
          IEC Nexus
       </Link>
    </header>
  );
}
