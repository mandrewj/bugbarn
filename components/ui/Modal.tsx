"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

export interface ModalOptions {
  wide?: boolean;
  cls?: string;
  noBackdropClose?: boolean;
}

interface ModalApi {
  open: (node: ReactNode, opts?: ModalOptions) => void;
  close: () => void;
}

const ModalContext = createContext<ModalApi>({ open: () => {}, close: () => {} });

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ node: ReactNode; opts: ModalOptions } | null>(null);

  const open = useCallback((node: ReactNode, opts: ModalOptions = {}) => setState({ node, opts }), []);
  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}
      {state && (
        <div
          className="scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !state.opts.noBackdropClose) close();
          }}
        >
          <div className={`modal ${state.opts.wide ? "wide" : ""} ${state.opts.cls || ""}`}>{state.node}</div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

/** Standard modal chrome: sticky header (kicker + title + close), body, optional footer. */
export function ModalShell({
  kicker,
  title,
  children,
  footer,
}: {
  kicker?: string;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { close } = useModal();
  return (
    <>
      <div className="modal-h">
        <div>
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h2>{title}</h2>
        </div>
        <button className="btn-icon" onClick={close} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>
      <div className="modal-b">{children}</div>
      {footer ? <div className="modal-f">{footer}</div> : null}
    </>
  );
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** If set, the user must type this exact phrase before Confirm enables. */
  confirmPhrase?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/** Loosely match a typed phrase: case-insensitive, trimmed, whitespace-collapsed. */
export function phraseMatches(typed: string, target: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return norm(typed) === norm(target);
}

function ConfirmDialog({ title, message, confirmLabel, cancelLabel, confirmPhrase, onConfirm, onCancel }: ConfirmOptions) {
  const { close } = useModal();
  const [typed, setTyped] = useState("");
  const danger = /delete|clear|remove|replace/i.test(confirmLabel);
  const phraseOk = !confirmPhrase || phraseMatches(typed, confirmPhrase);
  return (
    <ModalShell
      kicker="Please confirm"
      title={title}
      footer={
        <>
          <button
            className="btn btn-ghost"
            onClick={() => {
              close();
              onCancel?.();
            }}
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={!phraseOk}
            onClick={() => {
              close();
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>{message}</p>
      {confirmPhrase ? (
        <div className="field full" style={{ marginTop: 16 }}>
          <label>
            Type <b>{confirmPhrase}</b> to confirm
          </label>
          <input value={typed} autoFocus autoComplete="off" placeholder={confirmPhrase} onChange={(e) => setTyped(e.target.value)} />
        </div>
      ) : null}
    </ModalShell>
  );
}

/** Returns a `confirm(opts)` helper that opens a danger-aware confirm dialog. */
export function useConfirm() {
  const { open } = useModal();
  return useCallback((opts: ConfirmOptions) => open(<ConfirmDialog {...opts} />, { cls: "confirm" }), [open]);
}
