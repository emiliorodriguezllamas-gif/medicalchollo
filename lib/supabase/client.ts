import { createBrowserClient } from "@supabase/ssr";

function getCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !url.startsWith("https://") || url.includes("TODO")) {
    return {
      url: "https://demo-project.supabase.co",
      key: "demo-anon-key",
    };
  }
  return { url, key: key || "demo-anon-key" };
}

export function createClient() {
  const { url, key } = getCredentials();
  return createBrowserClient(url, key);
}
