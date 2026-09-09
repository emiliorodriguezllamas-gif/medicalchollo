import { NextRequest, NextResponse } from "next/server";
import { queryProducts } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const especialidad = searchParams.get("especialidad") ?? "";
  const marca = searchParams.get("marca") ?? "";
  const tienda = searchParams.get("tienda") ?? "";
  const orden = searchParams.get("orden") ?? "price_asc";
  const pagina = Number(searchParams.get("pagina") ?? 1);
  const perPage = 20;
  const offset = (pagina - 1) * perPage;

  let isSubscribed = false;
  try {
    const user = await getCurrentUser();
    isSubscribed = user?.isSubscribed ?? false;
  } catch {}

  // Consulta directa a la base de datos local SQLite
  const { products, total } = queryProducts({
    q,
    specialty: especialidad,
    brand: marca,
    store: tienda,
    sort: orden,
    limit: perPage,
    offset,
  });

  // Si está suscrito (o admin), mostrar nombre de la tienda ganadora
  const results = products.map((p: any) => {
    if (isSubscribed) {
      return {
        ...p,
        specialty_name: p.specialty_slug.charAt(0).toUpperCase() + p.specialty_slug.slice(1),
      };
    }
    const { min_price_store_name, ...rest } = p;
    return {
      ...rest,
      specialty_name: p.specialty_slug.charAt(0).toUpperCase() + p.specialty_slug.slice(1),
    };
  });

  return NextResponse.json({
    products: results,
    total,
    page: pagina,
    per_page: perPage,
    source: "sqlite_local",
  });
}
