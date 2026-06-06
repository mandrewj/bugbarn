"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type ToastKind = "ok" | "err";
interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
  out: boolean;
}

const ToastContext = createContext<(msg: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { id, msg, kind, out: false }]);
    // start exit animation, then remove (mirrors the prototype's ~2.6s)
    setTimeout(() => {
      setItems((xs) => xs.map((t) => (t.id === id ? { ...t, out: true } : t)));
      setTimeout(() => setItems((xs) => xs.filter((t) => t.id !== id)), 240);
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === "err" ? "err" : ""} ${t.out ? "out" : ""}`}>
            <Icon name={t.kind === "err" ? "alert" : "check"} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
