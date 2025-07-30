
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
            <div className="p-3 bg-primary text-primary-foreground rounded-full border">
              <Users className="h-10 w-10" />
            </div>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <div className="text-center">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </CardHeader>
          <CardContent>
            {children}
            <div className="mt-6 text-center text-sm">
              {footerText}{' '}
              <Link href={footerLink} className="underline font-semibold">
                {footerLinkText}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
