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
        else setMsg("Kayıt başarılı! E-postanı doğrula, sonra giriş yap.");
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
        <p className="font-semibold">Giriş yaptın</p>
        <p className="text-sm text-muted mt-1 mb-4">{user.email}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
        >
          Takip listeme git
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="rounded-3xl bg-surface border border-border shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-center">
          {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">
          Takip listen ve bildirimlerin tüm cihazlarında senkron olsun.
        </p>

        {!configured && (
          <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            ⚙️ Hesap özelliği için Supabase yapılandırılmamış. Şu an <b>demo modundasın</b> —
            takip ve bildirimler bu tarayıcıda yerel olarak saklanıyor.
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            disabled={!configured}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre (en az 6 karakter)"
            disabled={!configured}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!configured || busy}
            className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}
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
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>

      <p className="text-center text-sm text-muted mt-4">
        <Link href="/" className="hover:text-foreground">
          ← Aramaya dön
        </Link>
      </p>
    </div>
  );
}
