"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface VatContextType {
  withVat: boolean;
  setWithVat: (value: boolean) => void;
  toggleVat: () => void;
  formatDisplayPrice: (priceWithoutVat: number | null | undefined) => string;
}

const VatContext = createContext<VatContextType>({
  withVat: false,
  setWithVat: () => {},
  toggleVat: () => {},
  formatDisplayPrice: () => "0,00 €",
});

export function VatProvider({ children }: { children: React.ReactNode }) {
  const [withVat, setWithVat] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mc_with_vat");
    if (saved !== null) {
      setWithVat(saved === "true");
    }
  }, []);

  const handleSetWithVat = (val: boolean) => {
    setWithVat(val);
    localStorage.setItem("mc_with_vat", String(val));
  };

  const toggleVat = () => {
    handleSetWithVat(!withVat);
  };

  const formatDisplayPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined || isNaN(price)) return "—";
    const finalPrice = withVat ? price * 1.21 : price;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(finalPrice);
  };

  return (
    <VatContext.Provider
      value={{
        withVat,
        setWithVat: handleSetWithVat,
        toggleVat,
        formatDisplayPrice,
      }}
    >
      {children}
    </VatContext.Provider>
  );
}

export function useVat() {
  return useContext(VatContext);
}
