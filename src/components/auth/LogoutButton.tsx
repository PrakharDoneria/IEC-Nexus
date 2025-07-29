
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const { logout } = useAuth();

    return (
        <Button variant="outline" size="lg" className="w-full justify-center gap-3" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
        </Button>
    )
}
