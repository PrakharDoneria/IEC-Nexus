
import Link from 'next/link';
import { Users } from 'lucide-react';
import { NeoCard, NeoCardContent, NeoCardHeader } from '@/components/NeoCard';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

export function AuthCard({
  children,
  title,
  description,
  footerText,
  footerLink,
  footerLinkText,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="Home">
            <div className="p-3 bg-primary text-primary-foreground rounded-full">
              <Users className="h-10 w-10" />
            </div>
          </Link>
        </div>
        <NeoCard>
          <NeoCardHeader>
            <div className="text-center">
              <h1 className="font-headline text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </NeoCardHeader>
          <NeoCardContent>
            {children}
            <div className="mt-6 text-center text-sm">
              {footerText}{' '}
              <Link href={footerLink} className="underline font-semibold">
                {footerLinkText}
              </Link>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}
