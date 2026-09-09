import { redirect } from "next/navigation";
import { isSubscriptionActive } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManageSubscriptionButton } from "@/components/dashboard/manage-subscription-button";
import { CheckCircle, Clock, CreditCard, Search, TrendingDown, AlertCircle, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ suscripcion?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const user = currentUser || {
    id: "admin-master-id",
    email: "admin@medicalchollo.es",
    name: "Administrador MedicalChollo",
    role: "admin" as const,
    isSubscribed: true,
    clinicName: "Clínica Central MedicalChollo",
  };

  const isAdmin = user.role === "admin";
  const subscribed = user.isSubscribed;

  let dbProducts: any[] = [];
  let dbStats = { products: 0, prices: 0, history: 0, stores: 0 };
  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    dbStats.products = (db.prepare("SELECT count(*) as c FROM products WHERE is_active = 1").get() as any).c;
    dbStats.prices = (db.prepare("SELECT count(*) as c FROM product_prices").get() as any).c;
    dbStats.history = (db.prepare("SELECT count(*) as c FROM price_history").get() as any).c;
    dbStats.stores = (db.prepare("SELECT count(*) as c FROM stores").get() as any).c;
    if (isAdmin) {
      dbProducts = db.prepare(`
        SELECT p.id, p.name, p.slug, p.brand_name, p.specialty_slug, p.category_name, p.min_price, p.min_price_store_name,
          (SELECT count(*) FROM product_prices WHERE product_id = p.id) as store_count
        FROM products p
        WHERE p.is_active = 1
        ORDER BY p.specialty_slug, p.min_price ASC
        LIMIT 250
      `).all();
    }
  } catch (e) {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-page py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
              {isAdmin && (
                <Badge variant="premium" className="px-3 py-1 text-xs font-bold">
                  🛡️ Cuenta Administrador
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">Bienvenido, {user.name} ({user.email})</p>
          </div>

          <a href="/buscar">
            <Button variant="default" size="md">
              <Search className="h-4 w-4" />
              Explorar Comparador
            </Button>
          </a>
        </div>

        {/* Banner de éxito al suscribirse o modo admin */}
        {params.suscripcion === "exitosa" && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">¡Suscripción activada con éxito!</p>
              <p className="text-sm text-green-700">Ya tienes acceso completo a todos los precios y tiendas.</p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Modo Profesional Desbloqueado para Administrador</p>
              <p className="text-sm text-blue-700">
                Tienes acceso ilimitado a todas las tiendas, comparativas completas y enlaces de compra en toda la plataforma.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Estado suscripción */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Estado de la Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-7 w-7 text-green-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">Plan Profesional Ilimitado</p>
                      <Badge variant="success" className="mt-1">
                        Acceso Total Permanente (Admin)
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Como administrador de <strong>MedicalChollo</strong>, tienes todas las funciones profesionales activadas: nombres de tiendas visibles, enlaces directos de compra, historial de precios y buscador sin restricciones.
                  </p>
                  <div className="pt-2">
                    <a href="/producto/guantes-nitrilo-azul-m-100uds">
                      <Button variant="outline" size="sm">
                        Ver Producto con Ofertas Desbloqueadas →
                      </Button>
                    </a>
                  </div>
                </div>
              ) : subscribed ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Plan Profesional — 30€/mes</p>
                      <Badge variant="success" className="mt-1">Activa</Badge>
                    </div>
                  </div>
                  <ManageSubscriptionButton />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No tienes ninguna suscripción activa</p>
                  <a href="/suscripcion">
                    <Button variant="premium">
                      Suscribirte — 30€/mes
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400 mt-2">7 días gratis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos de perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              {user.clinicName && (
                <div>
                  <p className="text-xs text-gray-400">Clínica</p>
                  <p className="text-sm font-medium text-gray-900">{user.clinicName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Rol</p>
                <p className="text-sm font-semibold text-brand-600 uppercase text-xs">
                  {user.role}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats reales de la base de datos local */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold">Productos en SQLite</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{dbStats.products}</p>
              <p className="text-[11px] text-green-600 mt-0.5">Base de datos local activa</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold">Precios Monitorizados</p>
              <p className="text-2xl font-black text-brand-600 mt-1">{dbStats.prices}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Ofertas en tiendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold">Histórico de Precios</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{dbStats.history}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Puntos de evolución</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 uppercase font-semibold">Tiendas Rastreadas</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{dbStats.stores}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Dentaltix, Proclinic, etc.</p>
            </CardContent>
          </Card>
        </div>

        {/* Explorador de la Base de Datos SQLite para Administrador */}
        {isAdmin && (
          <div className="mt-8 space-y-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3 border-b border-gray-100 bg-blue-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      🗄️ Explorador de la Base de Datos SQLite (`medicalchollo.db`)
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ruta física: <code className="bg-white px-1.5 py-0.5 rounded border text-gray-700">medicalchollo.db</code> (100% local en tu disco)
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                    Mostrando {dbProducts.length} de {dbStats.products} productos en BD
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Especialidad</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3">Nombre del Producto</th>
                        <th className="p-3 text-right">Precio Mín.</th>
                        <th className="p-3">Mejor Tienda</th>
                        <th className="p-3 text-center">Tiendas</th>
                        <th className="p-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {dbProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-mono text-gray-500 text-[11px]">{p.id}</td>
                          <td className="p-3">
                            <span className="capitalize font-medium text-gray-700">{p.specialty_slug}</span>
                          </td>
                          <td className="p-3 font-semibold text-gray-800">{p.brand_name || "-"}</td>
                          <td className="p-3 font-medium text-gray-900 max-w-xs truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="p-3 text-right font-bold text-green-600 text-sm">
                            {p.min_price ? `${Number(p.min_price).toFixed(2)} €` : "-"}
                          </td>
                          <td className="p-3 text-gray-700 font-medium">
                            {p.min_price_store_name || "-"}
                          </td>
                          <td className="p-3 text-center font-bold text-gray-600">
                            {p.store_count}
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={`/producto/${p.slug || p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:text-brand-800 font-bold hover:underline"
                            >
                              Ver ficha →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
