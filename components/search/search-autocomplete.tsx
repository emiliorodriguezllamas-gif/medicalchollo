"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Package, ArrowRight, Loader2, Lock } from "lucide-react";
import { useVat } from "@/lib/vat-context";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  brand_name?: string;
  category_name?: string;
  specialty_slug: string;
  min_price: number;
  image_url?: string | null;
  min_price_store_name?: string | null;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  size?: "default" | "lg";
  autoFocus?: boolean;
}

export function SearchAutocomplete({
  placeholder = "Busca guantes, anestesia, composites, fresas...",
  className = "",
  size = "default",
  autoFocus = false,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const { formatDisplayPrice, withVat } = useVat();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click fuera para cerrar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda en vivo
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/producto/${results[selectedIndex].slug}`);
    } else if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isLarge = size === "lg";

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} action="/buscar" method="GET" className="relative w-full flex items-center">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${
            isLarge ? "h-5 w-5" : "h-4 w-4"
          }`}
        />
        <input
          name="q"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
            isLarge
              ? "h-14 pl-12 pr-28 text-base shadow-md"
              : "h-10 pl-10 pr-20 text-sm"
          }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-brand-600 mr-1" />
          )}
          <button
            type="submit"
            className={`rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors flex items-center justify-center shadow-xs ${
              isLarge ? "h-10 px-4 text-sm" : "h-7 px-2.5 text-xs"
            }`}
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Desplegable de sugerencias en vivo */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in-50 duration-150">
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500 flex items-center justify-between px-3">
            <span>Sugerencias en tiempo real</span>
            <span className="text-[11px] font-normal text-gray-400">
              {withVat ? "Precios con IVA (21%)" : "Precios sin IVA"}
            </span>
          </div>

          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {results.map((item, idx) => (
              <Link
                key={item.id}
                href={`/producto/${item.slug}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-3 transition-colors hover:bg-brand-50/60 ${
                  selectedIndex === idx ? "bg-brand-50" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <Package className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.brand_name && (
                      <span className="text-xs font-semibold text-gray-500">
                        {item.brand_name}
                      </span>
                    )}
                    {item.category_name && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.category_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  {item.min_price_store_name && (
                    <p className="text-[11px] text-green-700 font-semibold">
                      Mejor precio en: {item.min_price_store_name}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400 font-medium">desde</div>
                  <div className="text-base font-bold text-green-600">
                    {formatDisplayPrice(item.min_price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              href={`/buscar?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Ver todos los resultados para "{query}"
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
