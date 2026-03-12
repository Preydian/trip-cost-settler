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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <Input
          id="auth-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
          Password
        </label>
        <Input
          id="auth-password"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          minLength={6}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
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
              className="cursor-pointer font-medium text-foreground underline-offset-4 hover:underline"
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
              className="cursor-pointer font-medium text-foreground underline-offset-4 hover:underline"
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
