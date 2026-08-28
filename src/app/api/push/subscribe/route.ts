import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// Saves the browser push subscription to the user's account.
export async function POST(request: Request) {
  const sub = await request.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    // Supabase isn't configured — demo mode, just acknowledge.
    return NextResponse.json({ ok: true, stored: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
