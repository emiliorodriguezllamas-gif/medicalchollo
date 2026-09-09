import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.dentaltix.com" },
      { protocol: "https", hostname: "www.proclinic.es" },
      { protocol: "https", hostname: "www.dvd-dental.com" },
      { protocol: "https", hostname: "cdn.dentaltix.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
