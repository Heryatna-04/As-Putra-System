import { NextResponse } from "next/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] }, { headers: CACHE_HEADERS });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";

  try {
    const res = await fetch(`${baseUrl}/spare-parts?search=${encodeURIComponent(q)}&limit=5`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return NextResponse.json({ success: true, data: json.data }, { headers: CACHE_HEADERS });
      }
    }
  } catch {
    // Fallback
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://esvwatrnlqgcnvjtebmr.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseKey) {
    return NextResponse.json({ success: true, data: [] }, { headers: CACHE_HEADERS });
  }

  const sanitizedQ = q.replace(/[(),:;"'%_\\]/g, ' ').trim();
  if (!sanitizedQ) {
    return NextResponse.json({ success: true, data: [] }, { headers: CACHE_HEADERS });
  }

  const cleanNoSpace = sanitizedQ.replace(/\s+/g, "");
  const url = new URL(`${supabaseUrl}/rest/v1/spare_parts`);
  url.searchParams.append("select", "id,part_no,part_name,nama_umum,het,stok");
  url.searchParams.append("status", "eq.ACTIVE");
  url.searchParams.append("or", `(part_no.ilike.%${cleanNoSpace}%,part_name.ilike.%${sanitizedQ}%,nama_umum.ilike.%${sanitizedQ}%)`);
  url.searchParams.append("limit", "5");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
