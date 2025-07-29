import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeoButton } from "@/components/NeoButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an Account"
      description="Join IEC Nexus and connect with your peers."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Login"
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" type="text" placeholder="Your Name" required className="border-foreground border-2"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="name@example.com" required className="border-foreground border-2"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required className="border-foreground border-2"/>
        </div>
         <div className="space-y-2">
          <Label>Your Role</Label>
          <RadioGroup defaultValue="student" className="flex gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="r1" />
              <Label htmlFor="r1">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="faculty" id="r2" />
              <Label htmlFor="r2">Faculty</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground pt-1">
            Faculty must sign up with a verified @ieccollege.com email.
          </p>
        </div>
        <NeoButton type="submit" className="w-full">
          Create Account
        </NeoButton>
      </form>
    </AuthCard>
  );
}
