"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AuthView() {
  const { supabase, configured, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setMsg(error.message);
        else setMsg("Sign-up successful! Verify your email, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg(error.message);
        else router.push("/dashboard");
      }
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-3">👋</div>
        <p className="font-semibold">You&apos;re signed in</p>
        <p className="text-sm text-muted mt-1 mb-4">{user.email}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
        >
          Go to my tracked list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="rounded-3xl bg-surface border border-border shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-center">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">
          Keep your tracked list and notifications in sync across all your devices.
        </p>

        {!configured && (
          <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            ⚙️ Supabase isn&apos;t configured for the account feature. You&apos;re currently in <b>demo mode</b> —
            tracking and notifications are stored locally in this browser.
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled={!configured}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (at least 6 characters)"
            disabled={!configured}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!configured || busy}
            className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-center text-muted">{msg}</p>}

        <button
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setMsg(null);
          }}
          className="mt-4 w-full text-sm text-primary hover:underline"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <p className="text-center text-sm text-muted mt-4">
        <Link href="/" className="hover:text-foreground">
          ← Back to search
        </Link>
      </p>
    </div>
  );
}
