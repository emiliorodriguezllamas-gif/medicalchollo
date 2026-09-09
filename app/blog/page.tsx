import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog y Guías de Compra",
  description: "Consejos, comparativas de materiales dentales y estrategias para reducir costes en tu clínica.",
};

const articles = [
  {
    slug: "como-ahorrar-material-dental-guia-clinicas",
    title: "Cómo ahorrar hasta un 40% en suministros dentales sin bajar de calidad",
    excerpt: "Estrategias de compras para clínicas odontológicas: control de stock, marcas equivalentes y compras agrupadas.",
    category: "Gestión de Clínica",
    date: "7 de Septiembre, 2026",
    readTime: "5 min",
  },
  {
    slug: "comparativa-guantes-nitrilo-vs-latex",
    title: "Guantes de Nitrilo vs Látex: Comparativa de precios, normativas y resistencia",
    excerpt: "Análisis exhaustivo de los mejores guantes sanitarios del mercado y dónde encontrarlos al mejor precio por caja.",
    category: "Dental & Sanitario",
    date: "1 de Septiembre, 2026",
    readTime: "4 min",
  },
  {
    slug: "mejores-marcas-anestesia-dental-2026",
    title: "Guía de anestésicos locales dentales: Articaína vs Mepivacaína y diferencias de precio",
    excerpt: "Repaso de las principales marcas del mercado (Septodont, Inibsa, Dentsply) y su evolución de precios en los últimos 6 meses.",
    category: "Farmacología",
    date: "25 de Agosto, 2026",
    readTime: "6 min",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-5xl">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-3">Guías y Actualidad</Badge>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Blog de MedicalChollo</h1>
          <p className="mt-3 text-lg text-gray-600">
            Consejos de compra, análisis de suministros y técnicas de ahorro para profesionales sanitarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <Card key={art.slug} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="text-brand-600 font-semibold">{art.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {art.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {art.excerpt}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {art.date}
                  </span>
                  <Link href="/buscar" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    Ver productos
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
