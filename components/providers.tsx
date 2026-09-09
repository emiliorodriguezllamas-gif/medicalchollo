"use client";

import React from "react";
import { VatProvider } from "@/lib/vat-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VatProvider>
      {children}
    </VatProvider>
  );
}

