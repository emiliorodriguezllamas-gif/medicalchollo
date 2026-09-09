import Link from "next/link";
import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Marca */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Medical<span className="text-brand-600">Chollo</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              El comparador de precios para profesionales de la salud en España.
            </p>
          </div>

          {/* Especialidades */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Especialidades</h3>
            <ul className="mt-4 space-y-2">
              {[
                { label: "Dental", href: "/buscar?especialidad=dental" },
                { label: "Podología", href: "/buscar?especialidad=podologia" },
                { label: "Oftalmología", href: "/buscar?especialidad=oftalmologia" },
                { label: "Medicina", href: "/buscar?especialidad=medicina" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {[
                { label: "¿Cómo funciona?", href: "/#como-funciona" },
                { label: "Precios y suscripción", href: "/suscripcion" },
                { label: "Contacto", href: "/contacto" },
                { label: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              {[
                { label: "Aviso legal", href: "/legal/aviso-legal" },
                { label: "Política de privacidad", href: "/legal/privacidad" },
                { label: "Política de cookies", href: "/legal/cookies" },
                { label: "Términos de uso", href: "/legal/terminos" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} MedicalChollo. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-400">
            Los precios se actualizan automáticamente cada 12 horas.
          </p>
        </div>
      </div>
    </footer>
  );
}
