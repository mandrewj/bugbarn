"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/** Renders content into the print-only #printArea and triggers window.print(). */
const PrintContext = createContext<(node: ReactNode) => void>(() => {});

export function usePrint() {
  return useContext(PrintContext);
}

export function PrintProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null);

  const print = useCallback((content: ReactNode) => {
    setNode(content);
    // let the DOM paint before opening the print dialog
    setTimeout(() => window.print(), 60);
  }, []);

  useEffect(() => {
    const after = () => setNode(null);
    window.addEventListener("afterprint", after);
    return () => window.removeEventListener("afterprint", after);
  }, []);

  return (
    <PrintContext.Provider value={print}>
      {children}
      <div id="printArea">{node}</div>
    </PrintContext.Provider>
  );
}
