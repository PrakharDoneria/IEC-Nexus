import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <header className="hidden md:flex h-16 items-center border-b-2 border-foreground bg-card px-4 md:px-6">
            <h1 className="text-2xl font-headline font-bold">Settings</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-start justify-center">
            <SettingsForm />
        </main>
      </div>
    </div>
  );
}
