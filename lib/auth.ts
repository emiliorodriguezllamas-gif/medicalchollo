import { cookies } from "next/headers";
import { isSupabaseConfigured, isSubscriptionActive } from "./utils";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  isSubscribed: boolean;
  clinicName?: string;
};

export const ADMIN_CREDENTIALS = {
  email: "admin@medicalchollo.es",
  password: "admin123",
  name: "Administrador MedicalChollo",
  clinicName: "Clínica Central MedicalChollo",
};

/**
 * Obtiene el usuario actual desde la cookie de sesión o Supabase.
 * Para el admin, isSubscribed siempre es true.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("mc_session")?.value;

  if (sessionCookie) {
    let parsed: AppUser | null = null;
    try {
      // Intentar primero decodificando caracteres codificados en URL (%7B...)
      parsed = JSON.parse(decodeURIComponent(sessionCookie)) as AppUser;
    } catch {
      try {
        parsed = JSON.parse(sessionCookie) as AppUser;
      } catch {
        // Cookie corrupta
      }
    }

    if (parsed && parsed.email) {
      // El administrador siempre tiene suscripción profesional activa
      if (
        parsed.role === "admin" ||
        parsed.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()
      ) {
        parsed.isSubscribed = true;
        parsed.role = "admin";
      }
      return parsed;
    }
  }

  // Si Supabase está configurado, comprobar sesión de Supabase
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("./supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, clinic_name")
        .eq("id", user.id)
        .single();

      const isAdmin = user.email === ADMIN_CREDENTIALS.email;

      return {
        id: user.id,
        email: user.email ?? "",
        name: (profile as any)?.full_name ?? user.email?.split("@")[0] ?? "Usuario",
        role: isAdmin ? "admin" : "user",
        isSubscribed: isAdmin || isSubscriptionActive((sub as any)?.status),
        clinicName: (profile as any)?.clinic_name ?? undefined,
      };
    } catch {
      return null;
    }
  }

  return null;
}
