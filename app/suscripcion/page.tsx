"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Metadata } from "next";

const features = [
  "Acceso a todos los precios y tiendas",
  "Catálogo completo multitienda",
  "Actualización automática de precios",
  "Historial de precios (últimos 90 días)",
  "Alertas de bajada de precio por email",
  "Búsqueda por código EAN y referencia",
  "4 especialidades: Dental, Podología, Oftalmología, Medicina",
  "Soporte por email",
  "Cancela en cualquier momento",
];

const freeFeatures = [
  "Ver precio mínimo (sin ver la tienda)",
  "Búsqueda básica de productos",
  "Comparativa parcial (bloqueada)",
];

const faqs = [
  {
    q: "¿Necesito tarjeta de crédito para el periodo gratuito?",
    a: "No. Puedes explorar la plataforma 7 días completamente gratis sin introducir ningún método de pago.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay penalizaciones ni permanencias.",
  },
  {
    q: "¿Cómo se actualizan los precios?",
    a: "Nuestro sistema escanea automáticamente todas las tiendas cada 12 horas. Si una tienda actualiza sus precios, lo verás reflejado en menos de 12 horas.",
  },
  {
    q: "¿Añadís nuevas tiendas?",
    a: "Constantemente añadimos nuevas tiendas y distribuidores. Si echas en falta alguna, puedes solicitarla a través del formulario de contacto.",
  },
  {
    q: "¿Es legal el comparador de precios?",
    a: "Sí. La comparación de precios publicados públicamente en internet es una práctica legal y habitual en Europa. Nunca accedemos a precios privados ni bloqueados.",
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        // Redirigir a registro si no está autenticado
        window.location.href = "/registro?redirect=/suscripcion";
      } else {
        toast.error("Error al iniciar el proceso de pago");
      }
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-center">
        <Badge variant="premium" className="mb-4 px-4 py-1.5">
          🎉 7 días gratis — Sin tarjeta de crédito
        </Badge>
        <h1 className="text-4xl font-bold text-white mb-4">
          El comparador que paga por sí solo
        </h1>
        <p className="text-brand-200 text-lg max-w-2xl mx-auto">
          Por solo 30 €/mes, accede a todos los precios y ahorra una media de 300 €/mes en pedidos.
          El ROI es inmediato desde el primer pedido.
        </p>
      </section>

      <div className="container-page py-12">
        {/* Planes */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Plan Gratuito */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Gratis</h2>
              <p className="text-gray-500 text-sm mb-6">Para echar un vistazo</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">0€</span>
                <span className="text-gray-400">/mes</span>
              </div>
              <ul className="space-y-2 mb-8">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                  Sin acceso a tiendas ni links de compra
                </li>
              </ul>
              <Link href="/registro">
                <Button variant="outline" size="lg" className="w-full">
                  Crear cuenta gratis
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Plan Profesional */}
          <Card className="border-2 border-brand-500 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="premium" className="px-4 py-1">MÁS POPULAR</Badge>
            </div>
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Profesional</h2>
              <p className="text-gray-500 text-sm mb-6">Para clínicas que ahorran en serio</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">30€</span>
                <span className="text-gray-400">/mes</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">+ IVA · 7 días gratis</p>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="premium"
                size="xl"
                className="w-full"
                loading={loading}
                onClick={handleSubscribe}
              >
                Empezar 7 días gratis
                <Zap className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-gray-400 mt-3">
                No se cobra nada durante los primeros 7 días.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Garantía */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-6 py-4">
            <Lock className="h-6 w-6 text-green-600 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-green-900">Pago 100% seguro con Stripe</p>
              <p className="text-xs text-green-700">Cifrado SSL · Cancela en cualquier momento · Sin permanencias</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="text-gray-400 ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
