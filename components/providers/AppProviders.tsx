"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toasts";
import { ModalProvider } from "@/components/ui/Modal";
import { PrintProvider } from "@/components/ui/Print";
import { DataProvider } from "@/components/providers/DataProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  // ModalProvider must be innermost: modals are rendered by ModalProvider, so
  // they need Data/Toast/Print contexts as ancestors. (Previously Modal sat
  // above DataProvider, so any modal calling useData threw "useData must be
  // used within DataProvider".)
  return (
    <ToastProvider>
      <DataProvider>
        <PrintProvider>
          <ModalProvider>{children}</ModalProvider>
        </PrintProvider>
      </DataProvider>
    </ToastProvider>
  );
}
