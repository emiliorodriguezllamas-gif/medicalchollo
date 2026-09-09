import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind de forma segura */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un precio en euros */
export function formatPrice(
  price: number | null | undefined,
  options: { withVat?: boolean; decimals?: number } = {}
): string {
  if (price == null) return "—";
  const { decimals = 2 } = options;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

/** Calcula el precio con IVA (21% médico) */
export function withVat(price: number, vatRate = 0.21): number {
  return Math.round(price * (1 + vatRate) * 100) / 100;
}

/** Calcula el ahorro entre dos precios */
export function calculateSavings(
  maxPrice: number,
  minPrice: number
): { amount: number; percentage: number } {
  const amount = maxPrice - minPrice;
  const percentage = (amount / maxPrice) * 100;
  return {
    amount: Math.round(amount * 100) / 100,
    percentage: Math.round(percentage * 10) / 10,
  };
}

/** Formatea una fecha relativa (ej: "hace 3 horas") */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "justo ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays} días`;
  return past.toLocaleDateString("es-ES");
}

/** Genera un slug URL-friendly */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Verifica si una suscripción está activa */
export function isSubscriptionActive(
  status: string | null | undefined
): boolean {
  return status === "active" || status === "trialing";
}

/** Trunca texto largos */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/** Comprueba si Supabase está configurado con credenciales válidas */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(
    url &&
    url.startsWith("https://") &&
    !url.includes("TODO") &&
    !url.includes("demo-project")
  );
}

