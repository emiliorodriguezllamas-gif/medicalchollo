"use client";

import { formatPrice, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, CheckCircle, XCircle } from "lucide-react";

interface PriceTableProps {
  prices: any[];
  isSubscribed: boolean;
  productId: string;
}

const STORE_THEMES: Record<string, { bg: string; text: string; border: string; initial: string }> = {
  dentaltix: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", initial: "DT" },
  proclinic: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", initial: "PC" },
  "henry-schein": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", initial: "HS" },
  "dvd-dental": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", initial: "DVD" },
  fulldental: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", initial: "FD" },
  vozdental: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", initial: "VD" },
  "dgd-dental": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", initial: "DGD" },
  "dental-iberica": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", initial: "DI" },
  kalma: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", initial: "KL" },
  sanhigia: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", initial: "SH" },
  "dental-everest": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", initial: "DE" },
  bader: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", initial: "BD" },
  quirumed: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", initial: "QM" },
  herbitas: { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200", initial: "HB" },
  fisaude: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", initial: "FS" },
  totclinic: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", initial: "TC" },
  iberomed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", initial: "IB" },
};

export function PriceTable({ prices, isSubscribed, productId }: PriceTableProps) {
  if (prices.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        No hay precios disponibles para este producto
      </div>
    );
  }

  const inStockPrices = prices.filter((p) => p.in_stock);
  const minPrice = inStockPrices.length > 0 ? inStockPrices[0].price : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tienda / Depósito</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Diferencia</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Con IVA</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualizado</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {prices.map((price: any, i: number) => {
            const isBest = price.price === minPrice && price.in_stock;
            const storeSlug = price.stores?.slug ?? price.store_slug ?? "";
            const theme = STORE_THEMES[storeSlug] ?? {
              bg: "bg-gray-100",
              text: "text-gray-700",
              border: "border-gray-200",
              initial: "🏪",
            };
            const diff = minPrice ? price.price - minPrice : 0;

            return (
              <tr
                key={price.id ?? i}
                className={`transition-colors hover:bg-gray-50 ${isBest ? "bg-green-50/70" : ""}`}
              >
                {/* Tienda */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-12 shrink-0 rounded-md border flex items-center justify-center font-bold text-xs tracking-tight shadow-xs ${theme.bg} ${theme.text} ${theme.border}`}>
                      {theme.initial}
                    </div>
                    <div>
                      {isSubscribed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {price.stores?.name ?? price.store_name ?? "Tienda"}
                          </span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <Lock className="h-3 w-3" />
                          Tienda {i + 1}
                        </span>
                      )}
                    </div>
                    {isBest && (
                      <Badge variant="bestPrice" className="ml-1">Mejor precio</Badge>
                    )}
                  </div>
                </td>

                {/* Precio */}
                <td className="px-4 py-4 text-right">
                  <span className={`text-base font-bold ${isBest ? "text-green-600" : "text-gray-900"}`}>
                    {formatPrice(price.price)}
                  </span>
                </td>

                {/* Diferencia */}
                <td className="px-4 py-4 text-right">
                  {isBest ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Más barato
                    </span>
                  ) : diff > 0 ? (
                    <span className="text-xs font-medium text-amber-700">
                      +{formatPrice(diff)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Con IVA */}
                <td className="px-4 py-4 text-right">
                  <span className="text-sm text-gray-500">
                    {price.price_with_vat ? formatPrice(price.price_with_vat) : formatPrice(price.price * 1.21)}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-4 py-4 text-center">
                  {price.in_stock ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                  )}
                </td>

                {/* Actualizado */}
                <td className="px-4 py-4 text-right">
                  <span className="text-xs text-gray-400">{timeAgo(price.last_scraped)}</span>
                </td>

                {/* Botón comprar */}
                <td className="px-4 py-4 text-right">
                  {isSubscribed && price.store_url ? (
                    <a
                      href={price.store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant={isBest ? "success" : "outline"}
                        size="sm"
                        disabled={!price.in_stock}
                      >
                        {price.in_stock ? "Comprar" : "Sin stock"}
                        {price.in_stock && <ExternalLink className="h-3 w-3" />}
                      </Button>
                    </a>
                  ) : (
                    <a href="/suscripcion">
                      <Button variant="ghost" size="sm" className="text-gray-400">
                        <Lock className="h-3 w-3" />
                        Ver tienda
                      </Button>
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
