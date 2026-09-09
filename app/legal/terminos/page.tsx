import { Card, CardContent } from "@/components/ui/card";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones de Uso</h1>
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-gray-600 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. Condiciones Generales</h2>
            <p>
              El acceso y uso de MedicalChollo atribuye la condición de usuario e implica la aceptación plena de las presentes condiciones generales de contratación y uso del comparador.
            </p>

            <h2 className="text-lg font-bold text-gray-900">2. Suscripción y Pago</h2>
            <p>
              El acceso al Modo Profesional completo (desbloqueo de nombres de tiendas, enlaces directos de compra, historial detallado de precios y alertas) tiene un coste recurrente de <strong>30 €/mes (+ IVA aplicable)</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Prueba gratuita:</strong> Las nuevas cuentas disponen de un período inicial de prueba de 7 días sin coste.</li>
              <li><strong>Cancelación:</strong> El usuario puede cancelar su suscripción en cualquier momento desde su panel de control sin penalización ni permanencia. La suscripción permanecerá activa hasta el final del ciclo facturado.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900">3. Redirección a Tiendas Terceras</h2>
            <p>
              Los enlaces de compra redirigen a las tiendas y depósitos de venta directa. Las condiciones de entrega, portes, garantías y devoluciones de cada producto se rigen estrictamente por los términos de cada proveedor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
