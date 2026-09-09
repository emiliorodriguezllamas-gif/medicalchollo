import Link from "next/link";
import {
  Search, TrendingDown, Bell, Shield, ArrowRight,
  Check, Star, Zap, Building2, Eye, Footprints
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";

// Datos de ejemplo para mostrar en la landing
const featuredProducts = [
  {
    name: "Guantes Nitrilo Azul No Estériles Sin Polvo - Caja 100 uds",
    slug: "guantes-nitrilo-azul-no-esteriles-sin-polvo-100-uds",
    specialty: "Dental",
    stores: 3,
    minPrice: 2.70,
    maxPrice: 3.85,
    savings: 30,
    brand: "Santex",
  },
  {
    name: "Anestesia Ultracain D-S 1:200.000 - 50 Carpules",
    slug: "anestesia-ultracain-ds-200000-50-carpules",
    specialty: "Dental",
    stores: 3,
    minPrice: 28.50,
    maxPrice: 34.20,
    savings: 17,
    brand: "Septodont",
  },
  {
    name: "Composite Filtek Z250 A2 - Jeringa 4g",
    slug: "composite-filtek-z250-a2-4g",
    specialty: "Dental",
    stores: 3,
    minPrice: 14.80,
    maxPrice: 19.50,
    savings: 24,
    brand: "3M ESPE",
  },
];

const specialties = [
  {
    name: "Dental",
    slug: "dental",
    icon: "🦷",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    productCount: "12.000+",
    description: "Composites, anestesias, guantes, instrumentos...",
  },
  {
    name: "Podología",
    slug: "podologia",
    icon: "🦶",
    color: "bg-green-50 border-green-200 text-green-700",
    productCount: "3.500+",
    description: "Material ortopédico, instrumental, protectores...",
  },
  {
    name: "Oftalmología",
    slug: "oftalmologia",
    icon: "👁️",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    productCount: "2.800+",
    description: "Lentes, soluciones, instrumental diagnóstico...",
  },
  {
    name: "Medicina",
    slug: "medicina",
    icon: "🩺",
    color: "bg-red-50 border-red-200 text-red-700",
    productCount: "8.000+",
    description: "Desechables, diagnóstico, farmacia clínica...",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Busca tu producto",
    description:
      "Escribe el nombre, referencia o EAN del producto que necesitas en tu clínica.",
    icon: Search,
  },
  {
    step: "2",
    title: "Compara automáticamente",
    description:
      "Nuestro sistema escanea todas las tiendas y calcula el precio más bajo en tiempo real.",
    icon: TrendingDown,
  },
  {
    step: "3",
    title: "Ve a comprar y ahorra",
    description:
      "Con un clic, te llevamos directo al mejor precio. Simple, rápido y siempre actualizado.",
    icon: ArrowRight,
  },
];

const testimonials = [
  {
    name: "Dr. Carlos Martínez",
    role: "Director Clínica Dental",
    location: "Madrid",
    text: "Ahorramos más de 400€ al mes en material. La suscripción se paga sola en el primer pedido.",
    savings: "400€/mes",
  },
  {
    name: "Dra. Ana Ferreira",
    role: "Podóloga",
    location: "Barcelona",
    text: "Por fin puedo comparar precios sin perder horas mirando catálogos. Imprescindible.",
    savings: "180€/mes",
  },
  {
    name: "Dr. Luis Sánchez",
    role: "Oftalmólogo",
    location: "Valencia",
    text: "Excelente herramienta para clínicas. El histórico de precios es muy útil.",
    savings: "250€/mes",
  },
];

export default async function HomePage() {
  let totalProductsCount = 37;
  let totalStoresCount = 4;
  let specialtyCounts: Record<string, number> = {
    dental: 21,
    podologia: 9,
    oftalmologia: 3,
    medicina: 4,
  };

  let storesList: any[] = [];

  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    totalProductsCount = (db.prepare("SELECT count(*) as c FROM products WHERE is_active = 1").get() as any).c;
    totalStoresCount = (db.prepare("SELECT count(*) as c FROM stores").get() as any).c;
    const sRows = db.prepare("SELECT specialty_slug, count(*) as count FROM products WHERE is_active = 1 GROUP BY specialty_slug").all() as any[];
    for (const r of sRows) {
      specialtyCounts[r.specialty_slug] = r.count;
    }
    storesList = db.prepare(`
      SELECT name, slug, url,
        (SELECT count(*) FROM product_prices WHERE store_slug = stores.slug) as offers_count
      FROM stores
      ORDER BY offers_count DESC
    `).all() as any[];
  } catch (e) {}

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-20 lg:py-28">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white" />
        </div>

        <div className="container-page relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="premium" className="mb-6 text-sm px-4 py-1.5">
              🎉 7 días gratis — Sin tarjeta de crédito
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Compara precios de{" "}
              <span className="text-brand-200">suministros médicos</span>{" "}
              y ahorra hasta un <span className="text-green-400">40%</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
              Escaneamos automáticamente todas las tiendas dentales, de podología,
              oftalmología y más. Siempre el precio más bajo, actualizado cada 12 horas.
            </p>

            {/* Buscador hero con autocompletado en tiempo real */}
            <div className="mt-10 mx-auto max-w-xl text-left">
              <SearchAutocomplete
                size="lg"
                placeholder="Busca guantes, anestesia, composites, fresas..."
              />
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 text-center sm:gap-8">
              <div>
                <p className="text-3xl font-bold text-white">{totalProductsCount}</p>
                <p className="mt-1 text-sm text-brand-200">Productos en catálogo</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{totalStoresCount}</p>
                <p className="mt-1 text-sm text-brand-200">Tiendas rastreadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">12h</p>
                <p className="mt-1 text-sm text-brand-200">Actualización de precios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIENDAS COMPARADAS BANNER ===== */}
      <section className="bg-slate-900 border-t border-slate-800 py-6 text-slate-300">
        <div className="container-page">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Comparador multitienda independiente rastreando {totalStoresCount} depósitos y tiendas líderes en España
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {storesList.map((st) => (
              <a
                key={st.slug}
                href={st.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:scale-105"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{st.name}</span>
                {st.offers_count > 0 && (
                  <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded-full">
                    {st.offers_count} precios
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ESPECIALIDADES ===== */}
      <section className="py-16 bg-white">
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-gray-900">Todas las especialidades</h2>
            <p className="mt-3 text-gray-500">
              Catálogo activo en 4 especialidades médicas
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.map((s) => (
              <Link key={s.slug} href={`/buscar?especialidad=${s.slug}`}>
                <Card className={`border-2 ${s.color} transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full`}>
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <h3 className="text-base font-bold mb-1">{s.name}</h3>
                    <p className="text-xs font-semibold mb-2 opacity-70">
                      {specialtyCounts[s.slug] ?? 0} productos activos
                    </p>
                    <p className="text-xs opacity-70">{s.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCTOS EJEMPLO (COMPARADOR TEASER) ===== */}
      <section className="py-16 bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-gray-900">Así funciona el comparador</h2>
            <p className="mt-3 text-gray-500">
              Precios actualizados cada 12 horas. Ahorra desde el primer día.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {featuredProducts.map((product, i) => (
              <Link key={i} href={`/producto/${product.slug}`} className="block transition-transform hover:-translate-y-0.5">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Imagen placeholder */}
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                        🦷
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <Badge variant="dental" className="shrink-0">{product.specialty}</Badge>
                          <Badge variant="secondary" className="shrink-0">{product.brand}</Badge>
                        </div>
                        <p className="mt-1 font-semibold text-gray-900 text-sm truncate hover:text-brand-600 transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Comparado en {product.stores} tiendas</p>
                      </div>

                      {/* Precios */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-gray-400 line-through">
                            hasta {product.maxPrice.toFixed(2)}€
                          </span>
                          <Badge variant="success" className="text-xs">-{product.savings}%</Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {product.minPrice.toFixed(2)}€
                        </p>
                        <div className="mt-2">
                          <Button size="sm" variant="outline">
                            Comparar tiendas →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/suscripcion">
              <Button variant="premium" size="lg">
                🔓 Ver todos los precios y tiendas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              7 días gratis. Luego 30 €/mes. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como-funciona" className="py-16 bg-white">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-gray-900">¿Cómo funciona?</h2>
            <p className="mt-3 text-gray-500">
              Tres pasos para ahorrar en cada pedido de tu clínica
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="mb-2 text-sm font-bold text-brand-600">Paso {step.step}</div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="py-16 bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-gray-900">Lo que dicen los profesionales</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm italic mb-4">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role} · {t.location}</p>
                    </div>
                    <Badge variant="success" className="text-sm font-bold">
                      -{t.savings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING / CTA ===== */}
      <section className="py-20 bg-gradient-to-br from-brand-900 to-brand-700">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-white">Una suscripción. Todo el ahorro.</h2>
            <p className="mt-4 text-brand-200 text-lg">
              Por solo 30 €/mes, accede a todos los precios y tiendas.
              Una clínica media ahorra más de 300 €/mes — el ROI es inmediato.
            </p>

            <Card className="mt-10 overflow-hidden">
              <div className="bg-brand-600 px-6 py-4">
                <p className="text-center text-brand-100 text-sm font-medium uppercase tracking-wider">Plan Profesional</p>
                <div className="text-center mt-2">
                  <span className="text-5xl font-bold text-white">30€</span>
                  <span className="text-brand-200 text-lg">/mes</span>
                </div>
                <p className="text-center text-brand-200 text-sm mt-1">+ IVA · 7 días gratis</p>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-3 text-left">
                  {[
                    "Acceso a todos los precios y tiendas",
                    "Catálogo completo y actualizado de productos",
                    "Actualización automática periódica",
                    "Historial de precios y tendencias",
                    "Alertas de bajada de precio",
                    "Búsqueda por EAN y referencia",
                    "4 especialidades: Dental, Podología, Oftalmología, Medicina",
                    "Cancela en cualquier momento",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                      <Check className="h-5 w-5 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/suscripcion" className="block mt-8">
                  <Button variant="premium" size="xl" className="w-full">
                    Empezar 7 días gratis
                    <Zap className="h-5 w-5" />
                  </Button>
                </Link>
                <p className="mt-3 text-center text-xs text-gray-400">
                  No se cobra nada durante los primeros 7 días. Cancela cuando quieras.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
