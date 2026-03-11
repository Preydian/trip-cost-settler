"use client";

import { useState } from "react";
import { LinkIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareTripButton({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/trip/${tripId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <CheckIcon className="size-3.5" />
          Copied!
        </>
      ) : (
        <>
          <LinkIcon className="size-3.5" />
          Share
        </>
      )}
    </Button>
  );
}
