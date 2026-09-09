"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, LogIn, LayoutDashboard, Menu, X, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVat } from "@/lib/vat-context";

interface NavbarProps {
  userEmail?: string | null;
  isSubscribed?: boolean;
}

export function Navbar({ userEmail, isSubscribed }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { withVat, toggleVat } = useVat();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { label: "Dental", href: "/buscar?especialidad=dental" },
    { label: "Podología", href: "/buscar?especialidad=podologia" },
    { label: "Oftalmología", href: "/buscar?especialidad=oftalmologia" },
    { label: "Medicina", href: "/buscar?especialidad=medicina" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Medical<span className="text-brand-600">Chollo</span>
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions & Utilities */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* Selector de IVA (Con IVA / Sin IVA) */}
            <button
              onClick={toggleVat}
              title="Cambiar visualización de precios con o sin IVA"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Percent className="h-3 w-3 text-brand-600" />
              <span>IVA:</span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] ${withVat ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                {withVat ? "Con IVA" : "Sin IVA"}
              </span>
            </button>

            {userEmail ? (
              <>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                    ⚡ Modo Pro
                  </span>
                ) : (
                  <Link href="/suscripcion">
                    <Button variant="premium" size="sm">
                      🔓 30€/mes
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Mi cuenta
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
                <Link href="/suscripcion">
                  <Button variant="premium" size="sm">
                    Probar 7 días
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 sm:hidden space-y-2">
          {/* Selector IVA en móvil */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Precios:</span>
            <button
              onClick={toggleVat}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold"
            >
              {withVat ? "Con IVA (21%)" : "Sin IVA"}
            </button>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {userEmail ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-900"
                >
                  Mi cuenta ({userEmail})
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-900"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/suscripcion"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
                >
                  Empezar 7 días gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
