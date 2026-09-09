import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/utils";
import type { PriceEntry } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar suscripción
    const { data: { user } } = await supabase.auth.getUser();
    let isSubscribed = false;
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();
      isSubscribed = isSubscriptionActive(sub?.status);
    }

    // Obtener precios del producto con info de tienda
    const { data: prices, error } = await supabase
      .from("product_prices")
      .select(`
        store_id,
        price,
        price_with_vat,
        in_stock,
        store_url,
        last_scraped,
        stores!store_id (
          name,
          logo_url,
          slug
        )
      `)
      .eq("product_id", id)
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Error al cargar precios" }, { status: 500 });
    }

    if (!prices || prices.length === 0) {
      return NextResponse.json({ prices: [] });
    }

    // Calcular precio mínimo (solo de los que tienen stock)
    const inStockPrices = prices.filter((p: any) => p.in_stock);
    const minPrice = inStockPrices.length > 0
      ? Math.min(...inStockPrices.map((p: any) => p.price))
      : null;

    // Mapear y ocultar URLs si no hay suscripción
    const result: PriceEntry[] = (prices as any[]).map((p, index) => ({
      store_id: p.store_id,
      store_name: p.stores?.name ?? "Tienda desconocida",
      store_logo: p.stores?.logo_url ?? null,
      price: p.price,
      price_with_vat: p.price_with_vat,
      in_stock: p.in_stock,
      last_scraped: p.last_scraped,
      is_best_price: p.price === minPrice && p.in_stock,
      price_rank: index + 1,
      // Solo mostrar URL de compra a suscriptores
      ...(isSubscribed && { store_url: p.store_url }),
    }));

    return NextResponse.json({
      prices: result,
      is_subscribed: isSubscribed,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
