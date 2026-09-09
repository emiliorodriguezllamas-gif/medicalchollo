import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Borrar cookie de sesión
  response.cookies.delete("mc_session");

  // Si Supabase está configurado, cerrar sesión
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {}
  }

  return response;
}
