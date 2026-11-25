import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();

  if (error) {
    console.error("Supabase Storage test failed:", error.message);
    return NextResponse.json(
      { ok: false, message: "Storage connection failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    bucketFound: data.some((bucket) => bucket.name === "Gupta_Store"),
    bucketCount: data.length,
  });
}
