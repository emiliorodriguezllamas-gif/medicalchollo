"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Lock, Download, ArrowUpDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, timeAgo } from "@/lib/utils";
import { useVat } from "@/lib/vat-context";
import Link from "next/link";
import type { ProductSearchResult, Specialty, Brand } from "@/types";

interface SearchClientProps {
  initialQuery: string;
  initialSpecialty: string;
  initialBrand: string;
  initialStore?: string;
  initialSort?: string;
  initialPage: number;
  specialties: Pick<Specialty, "id" | "name" | "slug">[];
  brands: Pick<Brand, "id" | "name" | "slug">[];
  stores?: { id: string; name: string; slug: string; offers_count?: number }[];
  isSubscribed: boolean;
}

export function SearchClient({
  initialQuery,
  initialSpecialty,
  initialBrand,
  initialStore = "",
  initialSort = "price_asc",
  initialPage,
  specialties,
  brands,
  stores = [],
  isSubscribed,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [brand, setBrand] = useState(initialBrand);
  const [store, setStore] = useState(initialStore);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sincronizar automáticamente cuando cambie la URL
  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const specParam = searchParams.get("especialidad") ?? "";
    const brandParam = searchParams.get("marca") ?? "";
    const storeParam = searchParams.get("tienda") ?? "";
    const sortParam = searchParams.get("orden") ?? "price_asc";
    const pageParam = Number(searchParams.get("pagina") ?? 1);

    setQuery(qParam);
    setSpecialty(specParam);
    setBrand(brandParam);
    setStore(storeParam);
    setSort(sortParam);
    setPage(pageParam);
  }, [searchParams]);

  const PER_PAGE = 20;

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (specialty) params.set("especialidad", specialty);
      if (brand) params.set("marca", brand);
      if (store) params.set("tienda", store);
      if (sort && sort !== "price_asc") params.set("orden", sort);
      params.set("pagina", String(page));

      const res = await fetch(`/api/products/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, specialty, brand, store, sort, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Actualizar URL sin recargar página
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (specialty) params.set("especialidad", specialty);
    if (brand) params.set("marca", brand);
    if (store) params.set("tienda", store);
    if (sort && sort !== "price_asc") params.set("orden", sort);
    if (page > 1) params.set("pagina", String(page));
    router.replace(`/buscar?${params.toString()}`, { scroll: false });
  }, [query, specialty, brand, store, sort, page, router]);

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ["ID", "Nombre", "Especialidad", "Marca", "Mejor Precio (€)", "Tienda Ganadora", "Tiendas Comparadas", "Ahorro Máximo (€)"];
    const rows = results.map((r) => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      r.specialty_name ?? "",
      r.brand_name ?? "",
      r.min_price?.toFixed(2) ?? "",
      r.min_price_store_name ?? "",
      r.store_count,
      r.max_savings?.toFixed(2) ?? "0.00",
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `comparativa-medicalchollo-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const clearFilters = () => {
    setSpecialty("");
    setBrand("");
    setStore("");
    setSort("price_asc");
    setPage(1);
  };

  const specialtyColors: Record<string, string> = {
    dental: "dental",
    podologia: "podologia",
    oftalmologia: "oftalmologia",
    medicina: "warning",
  };

  return (
    <div>
      {/* Cabecera de búsqueda */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {query ? `Resultados para "${query}"` : "Buscar suministros médicos"}
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre, referencia o código EAN..."
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" loading={loading}>
            Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {(specialty || brand || store) && (
              <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {[specialty, brand, store].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </form>

        {/* Filtros expandibles (móvil/tablet) */}
        {filtersOpen && (
          <Card className="mt-3">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Especialidad */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Especialidad</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => { setSpecialty(""); setPage(1); }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                        specialty === "" ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Todas
                    </button>
                    {specialties.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => { setSpecialty(s.slug); setPage(1); }}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                          specialty === s.slug ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tienda */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tienda / Depósito</label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    <button
                      onClick={() => { setStore(""); setPage(1); }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                        store === "" ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Todas
                    </button>
                    {stores.map((st) => (
                      <button
                        key={st.slug}
                        onClick={() => { setStore(st.slug); setPage(1); }}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                          store === st.slug ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marcas */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Marca</label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    <button
                      onClick={() => { setBrand(""); setPage(1); }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                        brand === "" ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Todas
                    </button>
                    {brands.slice(0, 15).map((b) => (
                      <button
                        key={b.slug}
                        onClick={() => { setBrand(b.name); setPage(1); }}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                          brand.toLowerCase() === b.name.toLowerCase() ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {(specialty || brand || store) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium pt-2 border-t"
                >
                  <X className="h-3 w-3" /> Limpiar filtros ({[specialty, brand, store].filter(Boolean).length})
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar de filtros (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Especialidades */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Especialidad</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSpecialty(""); setPage(1); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${specialty === "" ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  Todas las especialidades
                </button>
                {specialties.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => { setSpecialty(s.slug); setPage(1); }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${specialty === s.slug ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiendas / Depósitos */}
            {stores.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tienda / Depósito</h3>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setStore(""); setPage(1); }}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${store === "" ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    Todas las tiendas ({stores.length})
                  </button>
                  {stores.map((st) => (
                    <button
                      key={st.slug}
                      onClick={() => { setStore(st.slug); setPage(1); }}
                      className={`flex items-center justify-between w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${store === st.slug ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      <span>{st.name}</span>
                      {st.offers_count && (
                        <span className="text-[10px] opacity-60">{st.offers_count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Marcas en Sidebar */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Marcas</h3>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => { setBrand(""); setPage(1); }}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${brand === "" ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  Todas las marcas
                </button>
                {brands.map((b) => (
                  <button
                    key={b.slug}
                    onClick={() => { setBrand(b.name); setPage(1); }}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${brand.toLowerCase() === b.name.toLowerCase() ? "bg-brand-100 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {(specialty || brand || store) && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium pt-2 border-t"
              >
                <X className="h-3 w-3" /> Limpiar filtros ({[specialty, brand, store].filter(Boolean).length})
              </button>
            )}
          </div>
        </aside>

        {/* Lista de productos */}
        <div className="lg:col-span-3">
          {/* Barra de Ordenación y Exportación */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              {loading ? "Buscando productos..." : (
                <>
                  <span className="font-bold text-gray-900">{total.toLocaleString()}</span> productos encontrados
                  {store && <span className="ml-1 text-brand-600 font-semibold">en {stores.find(s => s.slug === store)?.name || store}</span>}
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-brand-500 focus:border-brand-500 cursor-pointer font-medium"
                >
                  <option value="price_asc">Precio: más bajo primero</option>
                  <option value="savings">Mayor ahorro entre tiendas</option>
                  <option value="stores_desc">Más tiendas comparadas</option>
                  <option value="price_desc">Precio: más alto primero</option>
                  <option value="name_asc">Nombre (A - Z)</option>
                </select>
              </div>

              {results.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  title="Descargar listado actual de precios en formato CSV para Excel"
                  className="h-8 text-xs font-semibold gap-1.5 text-gray-700 hover:text-brand-700"
                >
                  <Download className="h-3.5 w-3.5 text-gray-500" />
                  CSV
                </Button>
              )}
            </div>
          </div>

          {/* Banner de suscripción */}
          {!isSubscribed && (
            <div className="mb-4 rounded-xl bg-brand-50 border border-brand-200 p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-900 text-sm">
                  🔒 Desbloquea los precios completos y las tiendas
                </p>
                <p className="text-xs text-brand-700 mt-0.5">
                  Suscríbete por 30€/mes — 7 días gratis sin tarjeta
                </p>
              </div>
              <Link href="/suscripcion" className="shrink-0">
                <Button variant="premium" size="sm">Ver planes</Button>
              </Link>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-2">No se encontraron productos</p>
              <p className="text-gray-400 text-sm">Prueba con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((product) => (
                <ProductResultCard
                  key={product.id}
                  product={product}
                  isSubscribed={isSubscribed}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {total > PER_PAGE && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-500">
                Página {page} de {Math.ceil(total / PER_PAGE)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / PER_PAGE)}
              >
                Siguiente →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductResultCard({
  product,
  isSubscribed,
}: {
  product: ProductSearchResult;
  isSubscribed: boolean;
}) {
  const specialtyVariants: Record<string, "dental" | "podologia" | "oftalmologia" | "default"> = {
    Dental: "dental",
    Podología: "podologia",
    Oftalmología: "oftalmologia",
  };

  const specialtyVariant = product.specialty_name
    ? specialtyVariants[product.specialty_name] ?? "default"
    : "default";

  const { formatDisplayPrice, withVat } = useVat();

  const getFallbackIcon = () => {
    if (product.specialty_name === "Dental") return "🦷";
    if (product.specialty_name === "Podología") return "🦶";
    if (product.specialty_name === "Oftalmología") return "👁️";
    return "🩺";
  };

  return (
    <Link href={`/producto/${product.slug}`}>
      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Imagen */}
            <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-2xl">{getFallbackIcon()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {product.specialty_name && (
                  <Badge variant={specialtyVariant}>{product.specialty_name}</Badge>
                )}
                {product.brand_name && (
                  <Badge variant="secondary">{product.brand_name}</Badge>
                )}
                {product.max_savings && product.max_savings > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    ⚡ Ahorra hasta {formatDisplayPrice(product.max_savings)}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
              {product.unit && (
                <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>
              )}
              {product.reviews_count && product.reviews_count > 0 ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-800">
                      {product.average_rating ? Number(product.average_rating).toFixed(1) : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    ({product.reviews_count})
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-400">
                    {product.store_count} {product.store_count === 1 ? "tienda" : "tiendas"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">
                  Comparado en {product.store_count} {product.store_count === 1 ? "tienda" : "tiendas"}
                </p>
              )}
            </div>

            {/* Precio & Acciones */}
            <div className="shrink-0 text-right space-y-1.5">
              {product.min_price ? (
                <>
                  <p className="text-xs text-gray-400">
                    Desde {withVat ? "(con IVA)" : "(sin IVA)"}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatDisplayPrice(product.min_price)}
                  </p>
                  {isSubscribed && product.min_price_store_name ? (
                    <p className="text-xs font-semibold text-green-700">en {product.min_price_store_name}</p>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-400">
                      <Lock className="h-3 w-3" />
                      <span>ver tienda</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 shadow-sm transition-colors">
                      Comparar {product.store_count} {product.store_count === 1 ? "tienda" : "tiendas"} →
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Sin precio</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
