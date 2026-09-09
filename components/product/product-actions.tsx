"use client";

import React, { useState } from "react";
import { useVat } from "@/lib/vat-context";
import { Bell, Check, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brandName?: string;
    imageUrl?: string | null;
    unit?: string;
    minPrice: number;
  };
  minPriceOffer?: {
    price: number;
    store_url?: string;
    store_name?: string;
    in_stock: boolean;
  } | null;
  isSubscribed: boolean;
}

export function ProductActions({ product, minPriceOffer, isSubscribed }: ProductActionsProps) {
  const { formatDisplayPrice, withVat } = useVat();
  const [alertSet, setAlertSet] = useState(false);

  const handlePriceAlert = () => {
    setAlertSet(true);
    toast.success(`Alerta activada: te avisaremos cuando ${product.name.substring(0, 30)}... baje de ${formatDisplayPrice(product.minPrice)}`);
  };

  return (
    <div className="space-y-4">
      {/* Precio actual con VAT toggle */}
      {minPriceOffer ? (
        <div>
          <p className="text-4xl font-extrabold text-green-700">
            {formatDisplayPrice(minPriceOffer.price)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {withVat ? "IVA incluido (21%)" : "Base imponible (+ IVA)"} · {minPriceOffer.in_stock ? "✅ En stock" : "❌ Agotado"}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Sin precio disponible</p>
      )}

      {/* Botón de compra directo / Paywall */}
      {isSubscribed && minPriceOffer?.store_url ? (
        <div className="space-y-2">
          <a href={minPriceOffer.store_url} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="success" size="lg" className="w-full font-bold text-base py-6 shadow-md hover:shadow-lg transition-all">
              Comprar en {minPriceOffer.store_name ?? "la tienda"}
              <ExternalLink className="h-5 w-5 ml-1" />
            </Button>
          </a>
          <p className="text-[11px] text-center text-green-700 font-medium">
            ↗ Te redirigimos directamente al producto en la web oficial
          </p>
        </div>
      ) : (
        <div>
          <div className="rounded-lg border border-dashed border-green-300 p-3 mb-2 text-center bg-white/70">
            <Lock className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-700 font-semibold">
              Suscríbete para ver las tiendas y acceder a los enlaces de compra
            </p>
          </div>
          <a href="/suscripcion" className="block">
            <Button variant="premium" size="lg" className="w-full font-bold">
              Desbloquear tiendas — 30€/mes
            </Button>
          </a>
          <p className="text-[11px] text-center text-gray-400 mt-1.5">7 días de prueba gratis</p>
        </div>
      )}

      {/* Alerta de precio */}
      <div className="pt-2 border-t border-green-200/60">
        <button
          onClick={handlePriceAlert}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 py-2 border border-dashed border-gray-300 rounded-lg bg-white/50 hover:bg-white transition-colors"
        >
          {alertSet ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-700 font-semibold">Alerta de bajada de precio activada</span>
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 text-gray-500" />
              <span>Avisarme si baja de precio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
