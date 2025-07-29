
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, sendEmailVerification, User } from "firebase/auth";
import app from "@/lib/firebase";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeoButton } from "@/components/NeoButton";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your email address.",
      });
      setUnverifiedUser(null); 
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: "There was a problem sending the verification email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedUser(null);
    const auth = getAuth(app);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUnverifiedUser(user);
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email address before logging in.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      router.push('/feed');

    } catch (error: any) {
      let message = "An error occurred during login.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password. Please try again.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    } finally {
      if(!unverifiedUser) setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome Back!"
      description="Log in to your IEC Nexus account."
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLinkText="Sign up"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@ieccollege.com" 
            required 
            className="border-foreground border-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
          <Input 
            id="password" 
            type="password" 
            required 
            className="border-foreground border-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {unverifiedUser ? (
          <NeoButton type="button" className="w-full" onClick={handleResendVerification} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </NeoButton>
        ) : (
          <NeoButton type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </NeoButton>
        )}
      </form>
    </AuthCard>
  );
}
