import { NextResponse } from "next/server";
import { searchAllSites } from "@/lib/adapters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const code = searchParams.get("code") ?? undefined;

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchAllSites(query, code);
  return NextResponse.json({ results, count: results.length });
}
