"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTrip } from "@/actions/trips";

export function CreateTripForm() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setName("");
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createTrip(name.trim());
      setOpen(false);
    });
  };

  if (!mounted) {
    return (
      <Button className="bg-foreground text-background hover:bg-foreground/90" disabled>
        <PlusIcon className="size-4" />
        New Trip
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-foreground text-background hover:bg-foreground/90">
            <PlusIcon className="size-4" />
            New Trip
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new trip</DialogTitle>
          <DialogDescription>
            Give your trip a name to get started.
          </DialogDescription>
        </DialogHeader>
        <Input
          ref={inputRef}
          placeholder="e.g. Bali 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          disabled={isPending}
        />
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isPending}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {isPending ? "Creating..." : "Create Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
