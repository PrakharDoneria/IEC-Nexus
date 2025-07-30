
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, sendEmailVerification, UserCredential } from "firebase/auth";
import app from "@/lib/firebase";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Faculty'>('Student');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, hit our own API to create the user in Firebase Auth and MongoDB
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }
      
      // Then, send the verification email from the client
      const auth = getAuth(app);

      // We need a brief moment for the auth state to be available on the client
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
      } else {
        // This is a fallback and shouldn't happen in a normal flow.
        // It indicates the client auth state didn't update in time.
        console.warn("Could not find user on client to send verification email. User must log in to get a new link.");
      }

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account and then log in.",
      });

      router.push('/login');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create an Account"
      description="Join IEC Nexus and connect with your peers."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            type="text" 
            placeholder="Your Name" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
         <div className="space-y-2">
          <Label>Your Role</Label>
          <RadioGroup 
            value={role} 
            onValueChange={(value) => setRole(value as 'Student' | 'Faculty')}
            className="flex gap-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Student" id="r1" />
              <Label htmlFor="r1">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Faculty" id="r2" />
              <Label htmlFor="r2">Faculty</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground pt-1">
            Faculty must sign up with a verified @ieccollege.com email.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
