import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getCredentials(isAdmin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = isAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith("https://") || url.includes("TODO")) {
    return {
      url: "https://demo-project.supabase.co",
      key: "demo-key",
    };
  }
  return { url, key: key || "demo-key" };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getCredentials(false);

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignorar en Server Components
        }
      },
    },
  });
}

/** Cliente con privilegios de administrador (solo en el servidor) */
export async function createAdminClient() {
  const cookieStore = await cookies();
  const { url, key } = getCredentials(true);

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}
