import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Scheduled (Vercel Cron) snapshot of the live dataset → committed to a
// GitHub backup repo. Configured in vercel.json to run every ~2 days.
//
// Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set;
// we reject anything else so the endpoint can't be triggered by randoms.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new NextResponse("unauthorized", { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !owner || !repo) {
    return NextResponse.json({ ok: false, skipped: "GitHub backup not configured" });
  }

  const data = await readStore();
  const path = "bugbarn.json";
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  const { Octokit } = await import("@octokit/rest");
  const octo = new Octokit({ auth: token });

  // Find the current file sha (required to update an existing file).
  let sha: string | undefined;
  try {
    const res = await octo.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(res.data) && "sha" in res.data) sha = res.data.sha;
  } catch {
    /* file doesn't exist yet — first backup */
  }

  await octo.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message: `backup: bug barn snapshot ${new Date().toISOString()}`,
    content,
    sha,
  });

  return NextResponse.json({
    ok: true,
    committed: { owner, repo, branch, path },
    counts: { collections: data.collections.length, sops: data.sops.length, carelogs: data.carelogs.length },
  });
}
