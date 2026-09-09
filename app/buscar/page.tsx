import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/utils";
import { SearchClient } from "@/components/search/search-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar suministros médicos",
  description: "Busca y compara precios de suministros médicos, dentales, podología y oftalmología.",
};

const DEFAULT_SPECIALTIES = [
  { id: "s-1", name: "Dental", slug: "dental" },
  { id: "s-2", name: "Podología", slug: "podologia" },
  { id: "s-3", name: "Oftalmología", slug: "oftalmologia" },
  { id: "s-4", name: "Medicina", slug: "medicina" },
];

const DEFAULT_BRANDS = [
  { id: "b-1", name: "3M ESPE", slug: "3m-espe" },
  { id: "b-2", name: "Septodont", slug: "septodont" },
  { id: "b-3", name: "Aurelia", slug: "aurelia" },
  { id: "b-4", name: "Komet", slug: "komet" },
  { id: "b-5", name: "Koken", slug: "koken" },
  { id: "b-6", name: "Bausch & Lomb", slug: "bausch-lomb" },
];

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    especialidad?: string;
    marca?: string;
    tienda?: string;
    orden?: string;
    pagina?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  let isSubscribed = false;
  let specialties = DEFAULT_SPECIALTIES;
  let brands = DEFAULT_BRANDS;
  let stores: any[] = [];

  try {
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    if (user) {
      isSubscribed = user.isSubscribed;
    }
  } catch {}

  try {
    const { querySpecialties, queryBrands, queryStores } = await import("@/lib/db");
    const dbSpecs = querySpecialties();
    const dbBrands = queryBrands();
    const dbStores = queryStores();
    if (dbSpecs && dbSpecs.length > 0) specialties = dbSpecs as any;
    if (dbBrands && dbBrands.length > 0) brands = dbBrands as any;
    if (dbStores && dbStores.length > 0) stores = dbStores as any;
  } catch (e) {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-page py-8">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchClient
            key={`${params.q ?? ""}-${params.especialidad ?? ""}-${params.marca ?? ""}-${params.tienda ?? ""}-${params.orden ?? ""}-${params.pagina ?? "1"}`}
            initialQuery={params.q ?? ""}
            initialSpecialty={params.especialidad ?? ""}
            initialBrand={params.marca ?? ""}
            initialStore={params.tienda ?? ""}
            initialSort={params.orden ?? "price_asc"}
            initialPage={Number(params.pagina ?? 1)}
            specialties={specialties}
            brands={brands}
            stores={stores}
            isSubscribed={isSubscribed}
          />
        </Suspense>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="skeleton h-64 rounded-xl" />
        <div className="lg:col-span-3 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
