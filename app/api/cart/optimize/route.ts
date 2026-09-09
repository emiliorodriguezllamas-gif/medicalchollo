import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface CartRequestItem {
  id: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: CartRequestItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "La cesta está vacía" }, { status: 400 });
    }

    const db = getDb();
    const storeList = db.prepare("SELECT slug, name, url, shipping_free_from FROM stores WHERE is_active = 1").all() as any[];

    // Obtener precios de cada producto en cada tienda
    const productIds = items.map((i) => i.id);
    const placeholders = productIds.map(() => "?").join(",");

    const allPrices = db.prepare(`
      SELECT pp.product_id, pp.store_slug, pp.store_name, pp.price, pp.in_stock, pp.store_url, p.name as product_name
      FROM product_prices pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.product_id IN (${placeholders})
    `).all(...productIds) as any[];

    // Mapear por product_id -> store_slug -> precio
    const priceMap: Record<string, Record<string, { price: number; in_stock: boolean; store_url: string; product_name: string; store_name: string }>> = {};

    for (const row of allPrices) {
      if (!priceMap[row.product_id]) priceMap[row.product_id] = {};
      priceMap[row.product_id][row.store_slug] = {
        price: row.price,
        in_stock: Boolean(row.in_stock),
        store_url: row.store_url,
        product_name: row.product_name,
        store_name: row.store_name,
      };
    }

    // 1. Calcular coste comprando todo en una sola tienda
    const singleStoreTotals: Record<string, { store_slug: string; store_name: string; subtotal: number; missing_items: number; items_count: number }> = {};

    for (const store of storeList) {
      let subtotal = 0;
      let missing = 0;
      let availableCount = 0;

      for (const item of items) {
        const storeOffer = priceMap[item.id]?.[store.slug];
        if (storeOffer && storeOffer.in_stock) {
          subtotal += storeOffer.price * item.quantity;
          availableCount++;
        } else {
          missing++;
        }
      }

      singleStoreTotals[store.slug] = {
        store_slug: store.slug,
        store_name: store.name,
        subtotal: Number(subtotal.toFixed(2)),
        missing_items: missing,
        items_count: availableCount,
      };
    }

    // 2. Calcular la Combinación Óptima MedicalChollo (Mejor precio para cada producto)
    const optimalGroups: Record<string, { store_name: string; store_slug: string; items: any[]; total: number }> = {};
    let optimalTotal = 0;

    for (const item of items) {
      const offers = priceMap[item.id];
      if (!offers) continue;

      // Buscar la tienda con menor precio en stock
      let bestStoreSlug: string | null = null;
      let bestPrice = Infinity;
      let bestOffer: any = null;

      for (const [slug, off] of Object.entries(offers)) {
        if (off.in_stock && off.price < bestPrice) {
          bestPrice = off.price;
          bestStoreSlug = slug;
          bestOffer = off;
        }
      }

      if (bestStoreSlug && bestOffer) {
        if (!optimalGroups[bestStoreSlug]) {
          optimalGroups[bestStoreSlug] = {
            store_slug: bestStoreSlug,
            store_name: bestOffer.store_name,
            items: [],
            total: 0,
          };
        }

        const lineTotal = bestPrice * item.quantity;
        optimalGroups[bestStoreSlug].items.push({
          product_id: item.id,
          product_name: bestOffer.product_name,
          unit_price: bestPrice,
          quantity: item.quantity,
          line_total: Number(lineTotal.toFixed(2)),
          store_url: bestOffer.store_url,
        });

        optimalGroups[bestStoreSlug].total += lineTotal;
        optimalTotal += lineTotal;
      }
    }

    // Redondear totales de grupos óptimos
    for (const g of Object.values(optimalGroups)) {
      g.total = Number(g.total.toFixed(2));
    }

    // Comparar con la tienda única más barata completa
    const singleStoreValues = Object.values(singleStoreTotals).filter((s) => s.missing_items === 0);
    const worstSingleTotal = Math.max(...Object.values(singleStoreTotals).map((s) => s.subtotal));
    const bestSingleTotal = singleStoreValues.length > 0
      ? Math.min(...singleStoreValues.map((s) => s.subtotal))
      : worstSingleTotal;

    const estimatedSavings = Number(Math.max(0, bestSingleTotal - optimalTotal).toFixed(2));

    return NextResponse.json({
      optimal_total: Number(optimalTotal.toFixed(2)),
      optimal_groups: Object.values(optimalGroups),
      single_store_comparisons: Object.values(singleStoreTotals),
      estimated_savings: estimatedSavings,
      best_single_total: Number(bestSingleTotal.toFixed(2)),
    });
  } catch (err) {
    console.error("Cart optimization error:", err);
    return NextResponse.json({ error: "Error optimizando cesta" }, { status: 500 });
  }
}
