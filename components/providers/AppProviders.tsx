"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toasts";
import { ModalProvider } from "@/components/ui/Modal";
import { PrintProvider } from "@/components/ui/Print";
import { DataProvider } from "@/components/providers/DataProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>
        <DataProvider>
          <PrintProvider>{children}</PrintProvider>
        </DataProvider>
      </ModalProvider>
    </ToastProvider>
  );
}
