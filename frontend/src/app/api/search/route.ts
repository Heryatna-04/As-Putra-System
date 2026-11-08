import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

const CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] }, { headers: CACHE_HEADERS });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/spare-parts?search=${encodeURIComponent(q)}&limit=5`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return NextResponse.json({ success: true, data: json.data }, { headers: CACHE_HEADERS });
      }
    }
  } catch (err) {
    console.error("[Search Route] Backend search error:", err);
  }

  return NextResponse.json({ success: false, data: [] }, { headers: CACHE_HEADERS });
}
