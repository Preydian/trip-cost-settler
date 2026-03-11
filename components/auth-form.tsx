"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/actions/auth";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    const action = mode === "signin" ? signIn : signUp;
    const result = await action(email.trim(), password);

    // If we get here, redirect didn't happen — there was an error
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        minLength={6}
        required
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? "..."
          : mode === "signin"
            ? "Sign In"
            : "Create Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              className="cursor-pointer underline hover:text-foreground"
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Have an account?{" "}
            <button
              type="button"
              className="cursor-pointer underline hover:text-foreground"
              onClick={() => { setMode("signin"); setError(null); }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
