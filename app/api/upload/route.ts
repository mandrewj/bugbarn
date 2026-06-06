import { NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// POST a downscaled image (already shrunk client-side) → Vercel Blob → { url }.
// In local dev without a Blob token the photo is returned as a data URL so the
// app still works end-to-end.
export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifyToken(token))) return new NextResponse("unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new NextResponse("no file", { status: 400 });

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`specimens/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return NextResponse.json({ url: blob.url });
  }

  // Dev fallback: inline as a data URL.
  const buf = Buffer.from(await file.arrayBuffer());
  const url = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
  return NextResponse.json({ url });
}
