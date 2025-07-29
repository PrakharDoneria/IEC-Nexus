import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeoButton } from "@/components/NeoButton";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back!"
      description="Log in to your IEC Nexus account."
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLinkText="Sign up"
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@ieccollege.com" required className="border-foreground border-2"/>
        </div>
        <div className="space-y-2">
            <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="#"
              className="ml-auto inline-block text-sm underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input id="password" type="password" required className="border-foreground border-2"/>
        </div>
        <NeoButton type="submit" className="w-full">
          Login
        </NeoButton>
      </form>
    </AuthCard>
  );
}
