
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CodingChallenge } from "@/components/challenge/CodingChallenge";

export default function ChallengePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center border-b bg-card px-4 md:px-6">
            <h1 className="text-2xl font-bold">Daily Coding Challenge</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-start justify-center">
            <CodingChallenge />
        </main>
      </div>
    </div>
  );
}
