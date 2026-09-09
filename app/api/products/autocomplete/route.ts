import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  let isSubscribed = false;
  try {
    const user = await getCurrentUser();
    isSubscribed = user?.isSubscribed ?? false;
  } catch {}

  const db = getDb();
  const pattern = `%${q}%`;

  const rows = db.prepare(`
    SELECT id, name, slug, brand_name, category_name, specialty_slug, min_price, min_price_store_name, image_url
    FROM products
    WHERE is_active = 1
      AND (name LIKE ? OR brand_name LIKE ? OR category_name LIKE ? OR ean LIKE ? OR manufacturer_ref LIKE ?)
    ORDER BY
      CASE
        WHEN name LIKE ? THEN 1
        WHEN brand_name LIKE ? THEN 2
        ELSE 3
      END,
      min_price ASC
    LIMIT 6
  `).all(pattern, pattern, pattern, pattern, pattern, `${q}%`, `${q}%`) as any[];

  const results = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    brand_name: r.brand_name,
    category_name: r.category_name,
    specialty_slug: r.specialty_slug,
    min_price: r.min_price,
    image_url: r.image_url,
    min_price_store_name: isSubscribed ? r.min_price_store_name : null,
  }));

  return NextResponse.json({ results });
}
