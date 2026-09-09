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
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const stopWords = new Set(["de", "la", "el", "en", "para", "con", "y", "del", "los", "las", "un", "una", "al", "por"]);
  const rawTokens = normalize(q)
    .split(/\s+/)
    .filter((t) => t.length > 0 && !stopWords.has(t));

  const tokens = rawTokens.length > 0 ? rawTokens : [normalize(q)];

  let where = "WHERE is_active = 1";
  const params: any[] = [];

  tokens.forEach((token) => {
    const stem = token.length > 3 && token.endsWith("s")
      ? (token.endsWith("es") ? token.slice(0, -2) : token.slice(0, -1))
      : token;
    where += ` AND (
      unaccent(name || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(category_name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(ean, '') || ' ' || COALESCE(manufacturer_ref, '')) LIKE ?
      OR unaccent(name) LIKE ?
    )`;
    params.push(`%${stem}%`, `%${token}%`);
  });

  const rows = db.prepare(`
    SELECT id, name, slug, brand_name, category_name, specialty_slug, min_price, min_price_store_name, image_url
    FROM products
    ${where}
    ORDER BY
      CASE
        WHEN unaccent(name) LIKE ? THEN 1
        WHEN unaccent(brand_name) LIKE ? THEN 2
        ELSE 3
      END,
      min_price ASC
    LIMIT 6
  `).all(...params, `${normalize(q)}%`, `${normalize(q)}%`) as any[];

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
