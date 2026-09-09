import { isSubscriptionActive, formatPrice, timeAgo, isSupabaseConfigured } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceChart } from "@/components/product/price-chart";
import { PriceTable } from "@/components/product/price-table";
import { ProductActions } from "@/components/product/product-actions";
import { ExternalLink, Lock, RefreshCw, TrendingDown, Package } from "lucide-react";
import type { Metadata } from "next";

const DEMO_PRODUCTS: Record<string, any> = {
  "guantes-nitrilo-azul-m-100uds": {
    id: "demo-1",
    name: "Guantes Nitrilo Azul Talla M - Caja 100 uds",
    slug: "guantes-nitrilo-azul-m-100uds",
    description: "Guantes de examen de nitrilo sin polvo de alta resistencia y sensibilidad táctil. Aptos para uso odontológico y médico.",
    ean: "8435123456789",
    manufacturer_ref: "AUR-NIT-BLU-M",
    image_url: null,
    unit: "Caja 100 uds",
    min_price: 4.35,
    specialties: { name: "Dental", slug: "dental", color: "#2563EB" },
    categories: { name: "Guantes" },
    brands: { name: "Aurelia" },
    prices: [
      { id: "p-1", store_id: "s-1", price: 4.35, price_with_vat: 5.26, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.dentaltix.com", stores: { name: "Dentaltix", slug: "dentaltix", logo_url: null, url: "https://www.dentaltix.com" } },
      { id: "p-2", store_id: "s-2", price: 5.10, price_with_vat: 6.17, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.proclinic.es", stores: { name: "Proclinic", slug: "proclinic", logo_url: null, url: "https://www.proclinic.es" } },
      { id: "p-3", store_id: "s-3", price: 5.80, price_with_vat: 7.02, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.dvd-dental.com", stores: { name: "DVD Dental", slug: "dvd-dental", logo_url: null, url: "https://www.dvd-dental.com" } },
    ],
  },
  "anestesia-ultracain-ds-200000-50-carpules": {
    id: "demo-2",
    name: "Anestesia Ultracain D-S 1:200.000 - 50 Carpules",
    slug: "anestesia-ultracain-ds-200000-50-carpules",
    description: "Anestésico local dental a base de articaína y epinefrina. Rápido inicio de acción y profundidad analgésica.",
    ean: "8470001234567",
    manufacturer_ref: "SEP-ULTRA-200",
    image_url: null,
    unit: "50 carpules",
    min_price: 28.50,
    specialties: { name: "Dental", slug: "dental", color: "#2563EB" },
    categories: { name: "Anestesia" },
    brands: { name: "Septodont" },
    prices: [
      { id: "p-4", store_id: "s-3", price: 28.50, price_with_vat: 29.64, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.dvd-dental.com", stores: { name: "DVD Dental", slug: "dvd-dental", logo_url: null, url: "https://www.dvd-dental.com" } },
      { id: "p-5", store_id: "s-1", price: 31.20, price_with_vat: 32.45, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.dentaltix.com", stores: { name: "Dentaltix", slug: "dentaltix", logo_url: null, url: "https://www.dentaltix.com" } },
      { id: "p-6", store_id: "s-2", price: 34.00, price_with_vat: 35.36, in_stock: true, last_scraped: new Date().toISOString(), store_url: "https://www.proclinic.es", stores: { name: "Proclinic", slug: "proclinic", logo_url: null, url: "https://www.proclinic.es" } },
    ],
  },
};

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    const demo = DEMO_PRODUCTS[slug] ?? DEMO_PRODUCTS["guantes-nitrilo-azul-m-100uds"];
    return {
      title: demo.name,
      description: demo.description,
    };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, min_price")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: (product as any).name,
    description: (product as any).description ?? `Compara precios de ${(product as any).name}.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: any = null;
  let prices: any[] = [];
  let isSubscribed = false;

  try {
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    if (user) {
      isSubscribed = user.isSubscribed;
    }
  } catch {}

  const { queryProductBySlug } = await import("@/lib/db");
  const sqliteResult = queryProductBySlug(slug);

  if (sqliteResult) {
    product = {
      ...sqliteResult.product,
      specialties: {
        name: sqliteResult.product.specialty_name ?? "Dental",
        slug: sqliteResult.product.specialty_slug ?? "dental",
        color: sqliteResult.product.specialty_color ?? "#2563EB",
      },
      categories: { name: sqliteResult.product.category_name },
      brands: { name: sqliteResult.product.brand_name },
    };
    prices = sqliteResult.prices.map((pr: any) => ({
      ...pr,
      stores: { name: pr.store_name, slug: pr.store_slug },
    }));
  } else if (!isSupabaseConfigured()) {
    product = DEMO_PRODUCTS[slug] ?? DEMO_PRODUCTS["guantes-nitrilo-azul-no-esteriles-sin-polvo-100-uds"];
    prices = product?.prices ?? [];
  } else {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const { data: p } = await supabase
        .from("products")
        .select(`
          *,
          specialties!specialty_id ( name, slug, color ),
          categories!category_id ( name ),
          brands!brand_id ( name ),
          stores!min_price_store_id ( name, logo_url )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      product = p;

      if (product) {
        if (!isSubscribed) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("status")
              .eq("user_id", authData.user.id)
              .single();
            isSubscribed = isSubscriptionActive((sub as any)?.status);
          }
        }

        const { data: pr } = await supabase
          .from("product_prices")
          .select(`
            *,
            stores!store_id ( name, logo_url, slug, url )
          `)
          .eq("product_id", product.id)
          .eq("is_active", true)
          .order("price", { ascending: true });

        prices = pr ?? [];
      }
    } catch (e) {
      // Fallback
    }
  }

  if (!product) notFound();

  const inStockPrices = prices.filter((p: any) => p.in_stock);
  const minPrice = inStockPrices.length > 0 ? inStockPrices[0] : null;
  const maxPrice = inStockPrices.length > 0 ? inStockPrices[inStockPrices.length - 1] : null;

  const specialtyVariant: any = {
    dental: "dental",
    podologia: "podologia",
    oftalmologia: "oftalmologia",
  };
  const specSlug = product.specialties?.slug;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-page py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-gray-900">Inicio</a>
          <span>/</span>
          <a href="/buscar" className="hover:text-gray-900">Buscar</a>
          <span>/</span>
          {product.specialties && (
            <>
              <a href={`/buscar?especialidad=${specSlug}`} className="hover:text-gray-900">
                {product.specialties.name}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cabecera del producto */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Imagen */}
                  <div className="h-32 w-32 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-2" />
                    ) : (
                      <Package className="h-12 w-12 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {product.specialties && (
                        <Badge variant={specialtyVariant[specSlug] ?? "default"}>
                          {product.specialties.name}
                        </Badge>
                      )}
                      {product.categories && (
                        <Badge variant="secondary">{product.categories.name}</Badge>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h1>
                    {product.brands && (
                      <p className="text-sm text-gray-500 mb-2">
                        Marca: <span className="font-medium text-gray-700">{product.brands.name}</span>
                      </p>
                    )}
                    {product.unit && (
                      <p className="text-sm text-gray-500">Presentación: <span className="font-medium">{product.unit}</span></p>
                    )}
                    {product.ean && (
                      <p className="text-xs text-gray-400 mt-1">EAN: {product.ean}</p>
                    )}
                    {product.manufacturer_ref && (
                      <p className="text-xs text-gray-400">Ref. fabricante: {product.manufacturer_ref}</p>
                    )}

                    {/* Última actualización */}
                    {minPrice && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Actualizado {timeAgo(minPrice.last_scraped)}
                      </p>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="mt-4 text-sm text-gray-600 border-t pt-4">{product.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Tabla de precios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-500" />
                  Comparativa de precios ({prices.length} tiendas)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PriceTable
                  prices={prices}
                  isSubscribed={isSubscribed}
                  productId={product.id}
                />
              </CardContent>
            </Card>

            {/* Gráfico histórico */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución del precio</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart productId={product.id} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: mejor precio */}
          <div className="space-y-4">
            {/* Caja de mejor precio interactiva */}
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-green-700 mb-3">
                  🏆 Mejor oferta detectada
                </p>
                <ProductActions
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    brandName: product.brands?.name,
                    imageUrl: product.image_url,
                    unit: product.unit,
                    minPrice: minPrice?.price ?? product.min_price ?? 0,
                  }}
                  minPriceOffer={
                    minPrice
                      ? {
                          price: minPrice.price,
                          store_url: minPrice.store_url,
                          store_name: minPrice.stores?.name,
                          in_stock: minPrice.in_stock,
                        }
                      : null
                  }
                  isSubscribed={isSubscribed}
                />

                {/* Ahorro vs precio más caro */}
                {maxPrice && minPrice && minPrice.price < maxPrice.price && (
                  <div className="mt-4 rounded-lg bg-white p-3 text-center border border-green-100">
                    <p className="text-xs text-gray-500">vs. precio más caro de otras tiendas</p>
                    <p className="text-lg font-bold text-green-600">
                      Ahorras {formatPrice(maxPrice.price - minPrice.price)}
                    </p>
                    <p className="text-xs text-gray-400">
                      ({Math.round(((maxPrice.price - minPrice.price) / maxPrice.price) * 100)}% de ahorro)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tiendas que venden este producto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tiendas disponibles</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {prices.map((price: any, i: number) => (
                    <div key={price.store_id ?? i} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-xs">🥇</span>}
                        {i === 1 && <span className="text-xs">🥈</span>}
                        {i === 2 && <span className="text-xs">🥉</span>}
                        {i > 2 && <span className="text-xs w-4">{i + 1}.</span>}
                        <span className="text-sm text-gray-700">
                          {isSubscribed ? price.stores?.name : (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Lock className="h-3 w-3" />
                              Tienda {i + 1}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${i === 0 ? "text-green-600" : "text-gray-700"}`}>
                        {formatPrice(price.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
