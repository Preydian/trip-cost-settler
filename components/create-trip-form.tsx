"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTrip } from "@/actions/trips";

export function CreateTripForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(() => createTrip(name.trim()));
  };

  return (
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
        {isPending ? "Creating..." : "New Trip"}
      </Button>
    </div>
  );
}
