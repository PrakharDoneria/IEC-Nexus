'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, MessageSquare, User, BookOpen, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers } from '@/lib/mock';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: '/feed', icon: LayoutDashboard, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/resources', icon: BookOpen, label: 'Resources' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const NavLink = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        isCollapsed ? 'justify-center' : ''
      )}
    >
      <item.icon className="h-5 w-5" />
      {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
  const user = mockUsers[0]; // Mock current user

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r-2 border-foreground bg-card transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex-1 flex flex-col gap-y-4">
        <header className="flex h-16 items-center border-b-2 border-foreground px-4 lg:h-[60px] lg:px-6">
           <Link href="/feed" className="flex items-center gap-2 font-headline font-semibold">
            <div className="p-2 bg-primary border-2 border-foreground rounded-md">
              <Users className="h-6 w-6 text-primary-foreground" />
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

      <div className="mt-auto p-4 space-y-4 border-t-2 border-foreground">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <Avatar className="h-10 w-10 border-2 border-foreground">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          )}
        </div>
         <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className="w-full justify-start gap-3" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Settings className="h-5 w-5" />
          {!isCollapsed && "Collapse"}
        </Button>
        <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className="w-full justify-start gap-3" asChild>
          <Link href="/">
            <LogOut className="h-5 w-5" />
            {!isCollapsed && "Logout"}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
