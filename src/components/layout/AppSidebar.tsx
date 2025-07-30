
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, MessageSquare, User, BookOpen, LogOut, Settings, PanelLeftClose, PanelLeftOpen, Code, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Badge } from '../ui/badge';

const navItems = [
  { href: '/feed', icon: LayoutDashboard, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', requiresBadge: true },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/challenge', icon: Code, label: 'Challenge' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const NavLink = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useUnreadCount();

  // Special handling for profile link
  const href = item.href === '/profile' && user ? `/profile/${user.id}` : item.href;
  
  // Make profile link active on any /profile/[id] page
  let isActive = pathname === href;
  if (item.href === '/profile') {
    isActive = pathname.startsWith('/profile');
  } else if (item.href === '/settings') {
     isActive = pathname.startsWith('/settings');
  } else if (item.href === '/challenge') {
    isActive = pathname.startsWith('/challenge');
  } else if (item.href === '/messages') {
    isActive = pathname.startsWith('/messages');
  } else if (item.href === '/leaderboard') {
    isActive = pathname.startsWith('/leaderboard');
  }


  const linkContent = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary relative',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        isCollapsed ? 'justify-center' : ''
      )}
    >
      <item.icon className="h-5 w-5" />
      {!isCollapsed && <span className="font-medium flex-1">{item.label}</span>}
      {item.requiresBadge && totalUnreadCount > 0 && !isCollapsed && (
        <Badge variant="destructive" className="h-5">{totalUnreadCount}</Badge>
      )}
      {item.requiresBadge && totalUnreadCount > 0 && isCollapsed && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}


export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { user, logout } = useAuth(); 
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex-1 flex flex-col gap-y-4 overflow-y-auto">
        <header className={cn("flex h-16 shrink-0 items-center border-b px-4", isCollapsed && "justify-center")}>
           <Link href="/feed" className="flex items-center gap-2 font-semibold">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            {!isCollapsed && <span className="">IEC Nexus</span>}
          </Link>
        </header>

        <nav className={cn("flex-1 px-2", isCollapsed ? 'space-y-2' : 'space-y-1')}>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-2 space-y-2 border-t">
        <div className={cn("p-2 rounded-lg", !isCollapsed && "border")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "mb-2")}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.name} data-ai-hint="user avatar" />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && user && (
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            )}
          </div>

          <div className={cn("space-y-1", isCollapsed ? "" : "border-t pt-2 mt-2")}>
              <Link
                  href="/settings"
                  className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary',
                      isSettingsActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                      isCollapsed ? 'justify-center' : ''
                  )}
                  >
                  <Settings className="h-5 w-5" />
                  {!isCollapsed && <span className="font-medium">Settings</span>}
              </Link>
          
              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className="w-full justify-start gap-3" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                {!isCollapsed && "Collapse"}
              </Button>
              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className="w-full justify-start gap-3" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && "Logout"}
              </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
