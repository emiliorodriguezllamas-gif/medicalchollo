import { NextRequest, NextResponse } from "next/server";
import { ADMIN_CREDENTIALS, type AppUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Comprobar cuenta de Administrador (Modo Profesional desbloqueado)
    if (
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const adminUser: AppUser = {
        id: "admin-master-id",
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: "admin",
        isSubscribed: true,
        clinicName: ADMIN_CREDENTIALS.clinicName,
      };

      const response = NextResponse.json({
        success: true,
        user: adminUser,
        message: "Sesión iniciada como Administrador (Modo Profesional)",
      });

      // Guardar cookie de sesión por 30 días
      response.cookies.set({
        name: "mc_session",
        value: JSON.stringify(adminUser),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // 2. Si Supabase está configurado, intentar autenticación con Supabase
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Credenciales incorrectas" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: { id: data.user.id, email: data.user.email },
      });
    }

    // Si no es admin y Supabase no está configurado
    return NextResponse.json(
      {
        error: "Credenciales incorrectas. Para entrar en modo profesional usa: admin@medicalchollo.es / admin123",
      },
      { status: 401 }
    );
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
