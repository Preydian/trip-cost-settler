"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTrip } from "@/actions/trips";

export function CreateTripForm() {
  const [name, setName] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(() => createTrip(name.trim()));
  };

  const handleResume = () => {
    if (!resumeId.trim()) return;
    router.push(`/trip/${resumeId.trim()}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="trip-name" className="text-sm font-medium">
          Trip Name
        </label>
        <div className="flex gap-2">
          <Input
            id="trip-name"
            placeholder="e.g. Bali 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isPending}
          />
          <Button onClick={handleCreate} disabled={!name.trim() || isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or resume a trip
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Paste trip ID"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleResume()}
        />
        <Button
          variant="outline"
          onClick={handleResume}
          disabled={!resumeId.trim()}
        >
          Resume
        </Button>
      </div>
    </div>
  );
}
