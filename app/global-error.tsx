"use client";

import { useEffect } from "react";

// Root error boundary: catches crashes that escape the route segment,
// including errors thrown from modals/providers rendered inside the app
// layout (above the segment boundary). Replaces the root layout, so it must
// render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24, background: "#f4efe3", color: "#3b2007" }}>
        <div style={{ maxWidth: 640, margin: "40px auto", background: "#fff", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 24 }}>
          <h1 style={{ marginTop: 0, fontSize: 22 }}>Something broke</h1>
          <p style={{ lineHeight: 1.55, color: "#6b5840" }}>
            The app hit an unexpected error. The details below help pin down the cause.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "ui-monospace, monospace",
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
          <button
            onClick={() => reset()}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#3b2007", color: "#fff", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
