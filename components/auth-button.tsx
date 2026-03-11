"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";

export function AuthButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{email}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => startTransition(() => signOut())}
        disabled={isPending}
      >
        Sign out
      </Button>
    </div>
  );
}
