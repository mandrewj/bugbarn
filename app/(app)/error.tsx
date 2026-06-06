"use client";

import { useEffect } from "react";

// Segment error boundary: surfaces the real client-side error (message +
// digest) instead of a detail-less crash screen, so failures are diagnosable
// in the browser and correlate with Vercel logs via the digest.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="panel" style={{ maxWidth: 640, margin: "40px auto", padding: 24 }}>
      <h1 className="ptitle" style={{ marginTop: 0 }}>Something broke on this screen</h1>
      <p className="muted" style={{ lineHeight: 1.55 }}>
        The page hit an unexpected error. The details below help pin down the cause.
      </p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "var(--mono)",
          fontSize: 12.5,
          background: "rgba(0,0,0,.05)",
          border: "1px solid rgba(0,0,0,.1)",
          borderRadius: 8,
          padding: "12px 14px",
          margin: "14px 0",
        }}
      >
        {error.message || "Unknown error"}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <button className="btn btn-ghost" onClick={() => location.reload()}>
          Reload page
        </button>
      </div>
    </div>
  );
}
