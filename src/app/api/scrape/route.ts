import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/adapters";

// Secondary flow: extract product details from a URL.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  if (!url.trim()) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }
  const product = await scrapeUrl(url);
  if (!product) {
    return NextResponse.json({ error: "unsupported site or product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}
