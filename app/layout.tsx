import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "MedicalChollo — Comparador de precios para profesionales de la salud",
    template: "%s | MedicalChollo",
  },
  description:
    "Compara precios de suministros dentales, podología, oftalmología y más. Encuentra siempre el precio más barato entre todas las tiendas online para profesionales.",
  keywords: [
    "comparador precios dental",
    "suministros médicos baratos",
    "material dental precio",
    "Dentaltix Proclinic comparar",
    "material podología precio",
    "suministros clínica España",
  ],
  authors: [{ name: "MedicalChollo" }],
  openGraph: {
    title: "MedicalChollo — El chollo de los suministros médicos",
    description: "Compara precios y ahorra en tus pedidos de material médico y dental.",
    siteName: "MedicalChollo",
    locale: "es_ES",
    type: "website",
  },
};

async function getAuthState() {
  try {
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    if (user) {
      return {
        userEmail: user.email,
        isSubscribed: user.isSubscribed,
      };
    }
  } catch {}
  return { userEmail: null, isSubscribed: false };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userEmail, isSubscribed } = await getAuthState();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <Navbar userEmail={userEmail} isSubscribed={isSubscribed} />
          <main>{children}</main>
          <Footer />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
