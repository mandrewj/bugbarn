"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, website }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(true);
        setBusy(false);
      }
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <div className="mark">
            <BrandMark />
          </div>
          <div>
            <b>Bug Barn</b>
            <small>Living Collections</small>
          </div>
        </div>
        <h1>Keeper access</h1>
        <p className="lead">Enter the shared access code to open the husbandry portal.</p>

        {/* honeypot: hidden from humans, tempting to bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          aria-hidden="true"
        />

        <div className={`field full ${error ? "err" : ""}`}>
          <label htmlFor="code">Access code</label>
          <input
            id="code"
            type="password"
            value={code}
            autoFocus
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder="••••••••••"
          />
          {error ? <div className="errmsg">That code didn’t work. Try again.</div> : null}
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
          {busy ? "Checking…" : "Enter the barn"}
        </button>
      </form>
    </div>
  );
}
