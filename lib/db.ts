import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ruta a la base de datos SQLite local
const DB_PATH = path.join(process.cwd(), "medicalchollo.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const isNew = !fs.existsSync(DB_PATH);
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");

    initSchema(dbInstance);

    // Si es nueva o está vacía, sembrar con catálogo rico inicial
    const count = dbInstance.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number };
    if (count.cnt === 0) {
      seedDatabase(dbInstance);
    }
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      logo_url TEXT,
      shipping_free_from REAL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS specialties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      specialty_slug TEXT NOT NULL,
      category_name TEXT,
      brand_name TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      ean TEXT,
      manufacturer_ref TEXT,
      image_url TEXT,
      unit TEXT,
      min_price REAL,
      min_price_store_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_prices (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      store_slug TEXT NOT NULL,
      store_name TEXT NOT NULL,
      price REAL NOT NULL,
      price_with_vat REAL,
      in_stock INTEGER DEFAULT 1,
      store_url TEXT NOT NULL,
      last_scraped DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      price REAL NOT NULL,
      recorded_at DATE NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_specialty ON products(specialty_slug);
    CREATE INDEX IF NOT EXISTS idx_product_prices_prod ON product_prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_prod ON price_history(product_id);
  `);
}

function seedDatabase(db: Database.Database) {
  // 1. Tiendas
  const insertStore = db.prepare(`
    INSERT OR IGNORE INTO stores (id, name, slug, url, shipping_free_from)
    VALUES (@id, @name, @slug, @url, @shipping_free_from)
  `);

  const stores = [
    { id: "s-dentaltix", name: "Dentaltix", slug: "dentaltix", url: "https://www.dentaltix.com", shipping_free_from: 99.0 },
    { id: "s-proclinic", name: "Proclinic", slug: "proclinic", url: "https://www.proclinic.es", shipping_free_from: 75.0 },
    { id: "s-dvd", name: "DVD Dental", slug: "dvd-dental", url: "https://www.dvd-dental.com", shipping_free_from: 80.0 },
    { id: "s-herbitas", name: "Herbitas", slug: "herbitas", url: "https://www.herbitas.com", shipping_free_from: 120.0 },
    { id: "s-schein", name: "Henry Schein", slug: "henry-schein", url: "https://www.henryschein.es", shipping_free_from: 95.0 },
    { id: "s-quirumed", name: "Quirumed", slug: "quirumed", url: "https://www.quirumed.com", shipping_free_from: 90.0 },
    { id: "s-dentaliberica", name: "Dental Ibérica", slug: "dental-iberica", url: "https://dentaliberica.com", shipping_free_from: 65.0 },
    { id: "s-fisaude", name: "Fisaude", slug: "fisaude", url: "https://tienda.fisaude.com", shipping_free_from: 70.0 },
    { id: "s-iberomed", name: "Iberomed", slug: "iberomed", url: "https://iberomed.es", shipping_free_from: 80.0 },
    { id: "s-fulldental", name: "Fulldental", slug: "fulldental", url: "https://fulldental.es", shipping_free_from: 65.0 },
    { id: "s-vozdental", name: "Vozdental", slug: "vozdental", url: "https://vozdental.es", shipping_free_from: 80.0 },
    { id: "s-dgd", name: "DGD (Dental Good Deal)", slug: "dgd-dental", url: "https://www.dentalgooddeal.es", shipping_free_from: 70.0 },
    { id: "s-kalma", name: "Kalma", slug: "kalma", url: "https://kalma.es", shipping_free_from: 90.0 },
    { id: "s-sanhigia", name: "Sanhigia", slug: "sanhigia", url: "https://sanhigia.com", shipping_free_from: 85.0 },
    { id: "s-everest", name: "Dental Everest", slug: "dental-everest", url: "https://dentaleverest.es", shipping_free_from: 60.0 },
    { id: "s-bader", name: "Bader Dental", slug: "bader", url: "https://bader.es", shipping_free_from: 100.0 },
    { id: "s-totclinic", name: "Totclinic", slug: "totclinic", url: "https://totclinic.com", shipping_free_from: 75.0 },
  ];
  for (const s of stores) insertStore.run(s);

  // 2. Especialidades
  const insertSpec = db.prepare(`
    INSERT OR IGNORE INTO specialties (id, name, slug, color)
    VALUES (@id, @name, @slug, @color)
  `);
  insertSpec.run({ id: "spec-dental", name: "Dental", slug: "dental", color: "#2563EB" });
  insertSpec.run({ id: "spec-podo", name: "Podología", slug: "podologia", color: "#16A34A" });
  insertSpec.run({ id: "spec-oftal", name: "Oftalmología", slug: "oftalmologia", color: "#9333EA" });
  insertSpec.run({ id: "spec-med", name: "Medicina", slug: "medicina", color: "#DC2626" });

  // 3. Catálogo de productos inicial rico
  const catalog = [
    // --- DENTAL ---
    {
      id: "prod-1",
      specialty_slug: "dental",
      category_name: "Guantes",
      brand_name: "Santex",
      name: "Guantes de Nitrilo Azul No Estériles Sin Polvo (100 uds)",
      slug: "guantes-nitrilo-azul-no-esteriles-sin-polvo-100-uds",
      description: "Guantes de exploración de nitrilo azul con microtextura en dedos. Gran resistencia a la rotura y desgarro.",
      ean: "8435123456789",
      manufacturer_ref: "STX-NIT-BLUE-100",
      image_url: "https://cdn.dentaltix.com/es/varios/guantes-nitrilo-no-esteriles-sin-polvo-100-uds",
      unit: "Caja 100 uds",
      min_price: 2.70,
      min_price_store_name: "Dentaltix",
      prices: [
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 2.70, store_url: "https://www.dentaltix.com/es/varios/guantes-nitrilo-no-esteriles-sin-polvo-100-uds" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 3.40, store_url: "https://www.proclinic.es/tienda/?s=guantes+nitrilo" },
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 3.85, store_url: "https://www.dvd-dental.com/search.php?q=guantes+nitrilo" },
      ],
    },
    {
      id: "prod-2",
      specialty_slug: "dental",
      category_name: "Guantes",
      brand_name: "Santex",
      name: "Guantes de Látex Sin Polvo (100 uds)",
      slug: "guantes-latex-sin-polvo-100-uds",
      description: "Guantes de látex natural no estériles con excelente elasticidad y ajuste anatómico perfecto para clínica dental.",
      ean: "8435123456790",
      manufacturer_ref: "STX-LATEX-PF-100",
      image_url: null,
      unit: "Caja 100 uds",
      min_price: 2.90,
      min_price_store_name: "Dentaltix",
      prices: [
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 2.90, store_url: "https://www.dentaltix.com/es/varios/guantes-latex-sin-polvo-100-uds" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 3.65, store_url: "https://www.proclinic.es/tienda/?s=guantes+latex" },
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 3.50, store_url: "https://www.dvd-dental.com/search.php?q=guantes+latex" },
      ],
    },
    {
      id: "prod-3",
      specialty_slug: "dental",
      category_name: "Anestesia",
      brand_name: "Septodont",
      name: "Anestesia Ultracain D-S 1:200.000 (50 carpules)",
      slug: "anestesia-ultracain-ds-200000-50-carpules",
      description: "Articaína al 4% con epinefrina 1:200.000. Profunda acción anestésica para procedimientos rutinarios y quirúrgicos.",
      ean: "8470001234567",
      manufacturer_ref: "SEP-ULTRA-200",
      image_url: null,
      unit: "50 carpules",
      min_price: 28.50,
      min_price_store_name: "DVD Dental",
      prices: [
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 28.50, store_url: "https://www.dvd-dental.com/search.php?q=ultracain" },
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 31.20, store_url: "https://www.dentaltix.com/es/septodont" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 33.90, store_url: "https://www.proclinic.es/tienda/?s=anestesia+ultracain" },
      ],
    },
    {
      id: "prod-4",
      specialty_slug: "dental",
      category_name: "Composites y Adhesivos",
      brand_name: "3M ESPE",
      name: "Composite Filtek Z250 Universal (Jeringa 4g - Color A2)",
      slug: "composite-filtek-z250-a2-4g",
      description: "Composite universal híbrido de 3M con baja contracción de polimerización y excelente pulido estético duradero.",
      ean: "4046719123456",
      manufacturer_ref: "3M-6020A2",
      image_url: null,
      unit: "Jeringa 4g",
      min_price: 14.80,
      min_price_store_name: "Proclinic",
      prices: [
        { store_slug: "proclinic", store_name: "Proclinic", price: 14.80, store_url: "https://www.proclinic.es/tienda/?s=composite+filtek" },
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 16.50, store_url: "https://www.dentaltix.com/es/3m/filtek-supreme-xte-kit-composite-profesional-12-jer" },
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 17.20, store_url: "https://www.dvd-dental.com/search.php?q=filtek" },
      ],
    },
    {
      id: "prod-5",
      specialty_slug: "dental",
      category_name: "Desechables y Consumibles",
      brand_name: "Euronda",
      name: "Baberos Monoart Towel Up (Caja de 500 uds - Azul)",
      slug: "baberos-monoart-towel-up-500uds-azul",
      description: "Baberos desechables plastificados impermeables altamente absorbentes para pacientes de clínica dental.",
      ean: "8032758123456",
      manufacturer_ref: "EUR-MONO-BLUE-500",
      image_url: null,
      unit: "Caja 500 uds",
      min_price: 18.90,
      min_price_store_name: "Dentaltix",
      prices: [
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 18.90, store_url: "https://www.dentaltix.com/es/euronda" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 21.40, store_url: "https://www.proclinic.es/tienda/?s=baberos+monoart" },
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 22.10, store_url: "https://www.dvd-dental.com/search.php?q=baberos" },
      ],
    },
    {
      id: "prod-6",
      specialty_slug: "dental",
      category_name: "Fresas y Brocas",
      brand_name: "Komet",
      name: "Fresas de Carburo de Tungsteno Redonda H1 (Pack 5 uds)",
      slug: "fresas-carburo-tungsteno-redonda-h1-pack5",
      description: "Fresas quirúrgicas y operativas de alta precisión para contraángulo y turbina dental.",
      ean: "4029123456789",
      manufacturer_ref: "KOM-H1-014",
      image_url: null,
      unit: "Pack 5 uds",
      min_price: 11.20,
      min_price_store_name: "DVD Dental",
      prices: [
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 11.20, store_url: "https://www.dvd-dental.com/search.php?q=fresas+komet" },
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 12.95, store_url: "https://www.dentaltix.com/es/komet/fresas-carburo-h1-ca-5ud" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 13.80, store_url: "https://www.proclinic.es/tienda/?s=fresas+komet" },
      ],
    },
    // --- PODOLOGÍA ---
    {
      id: "prod-7",
      specialty_slug: "podologia",
      category_name: "Fresas de Podología",
      brand_name: "Busch",
      name: "Fresa de Carburo Diamantada para Uñas Gruesas (Ref. 425G)",
      slug: "fresa-carburo-diamantada-podologia-busch-425g",
      description: "Fresa especializada para desbastado y fresado rápido e higiénico de hiperqueratosis y uñas engrosadas.",
      ean: "4012345678901",
      manufacturer_ref: "BSH-425G-060",
      image_url: null,
      unit: "1 unidad",
      min_price: 16.40,
      min_price_store_name: "Herbitas",
      prices: [
        { store_slug: "herbitas", store_name: "Herbitas", price: 16.40, store_url: "https://herbitas.com/catalogsearch/result/?q=busch" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 19.10, store_url: "https://www.proclinic.es/tienda/?s=fresas+busch" },
      ],
    },
    {
      id: "prod-8",
      specialty_slug: "podologia",
      category_name: "Siliconas y Ortesis",
      brand_name: "Herbitas",
      name: "Silicona para Ortesis Blandi-Plus Shore A 14-16 (Bote 500g)",
      slug: "silicona-ortesis-blandi-plus-500g",
      description: "Silicona de adición bicomponente muy suave y elástica para la confección de ortesis paliativas de silicona.",
      ean: "8436001234567",
      manufacturer_ref: "HRB-BLANDI-500",
      image_url: null,
      unit: "Bote 500g",
      min_price: 34.50,
      min_price_store_name: "Herbitas",
      prices: [
        { store_slug: "herbitas", store_name: "Herbitas", price: 34.50, store_url: "https://herbitas.com/catalogsearch/result/?q=blandi+plus" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 38.90, store_url: "https://www.proclinic.es/tienda/?s=silicona+ortesis" },
      ],
    },
    // --- OFTALMOLOGÍA ---
    {
      id: "prod-9",
      specialty_slug: "oftalmologia",
      category_name: "Soluciones y Gotas",
      brand_name: "Bausch & Lomb",
      name: "Solución Salina Balanceada BSS Plus (Frasco 500ml)",
      slug: "solucion-salina-balanceada-bss-plus-500ml",
      description: "Solución salina intraocular isotónica y tamponada para irrigación durante intervenciones quirúrgicas oculares.",
      ean: "8470009876543",
      manufacturer_ref: "BL-BSS-500",
      image_url: null,
      unit: "Frasco 500ml",
      min_price: 9.80,
      min_price_store_name: "Proclinic",
      prices: [
        { store_slug: "proclinic", store_name: "Proclinic", price: 9.80, store_url: "https://www.proclinic.es/tienda/?s=solucion+salina" },
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 11.30, store_url: "https://www.dentaltix.com/es/clinica-dental" },
      ],
    },
    // --- MEDICINA GENERAL ---
    {
      id: "prod-10",
      specialty_slug: "medicina",
      category_name: "Material Sanitario",
      brand_name: "Hartmann",
      name: "Gasas Estériles de Algodón 10x10cm (Caja 100 sobres x 2 uds)",
      slug: "gasas-esteriles-algodon-10x10cm-100sobres",
      description: "Compresas de gasa hidrófila rectilínea 100% algodón 17 hilos de alta absorción para curas clínicas.",
      ean: "4049500123456",
      manufacturer_ref: "HRT-GASA-10X10",
      image_url: null,
      unit: "Caja 200 uds",
      min_price: 7.90,
      min_price_store_name: "Dentaltix",
      prices: [
        { store_slug: "dentaltix", store_name: "Dentaltix", price: 7.90, store_url: "https://www.dentaltix.com/es/hartmann/medicomp-gasas-esteriles-30gr-5x5cm" },
        { store_slug: "proclinic", store_name: "Proclinic", price: 8.95, store_url: "https://www.proclinic.es/tienda/?s=gasas+esteriles" },
        { store_slug: "dvd-dental", store_name: "DVD Dental", price: 9.20, store_url: "https://www.dvd-dental.com/search.php?q=gasas" },
      ],
    },
  ];

  const insertProd = db.prepare(`
    INSERT OR REPLACE INTO products
      (id, specialty_slug, category_name, brand_name, name, slug, description, ean, manufacturer_ref, image_url, unit, min_price, min_price_store_name)
    VALUES
      (@id, @specialty_slug, @category_name, @brand_name, @name, @slug, @description, @ean, @manufacturer_ref, @image_url, @unit, @min_price, @min_price_store_name)
  `);

  const insertPrice = db.prepare(`
    INSERT OR REPLACE INTO product_prices
      (id, product_id, store_slug, store_name, price, price_with_vat, in_stock, store_url)
    VALUES
      (@id, @product_id, @store_slug, @store_name, @price, @price_with_vat, @in_stock, @store_url)
  `);

  const insertHist = db.prepare(`
    INSERT OR REPLACE INTO price_history
      (id, product_id, store_name, price, recorded_at)
    VALUES
      (@id, @product_id, @store_name, @price, @recorded_at)
  `);

  const now = new Date();

  for (const item of catalog) {
    const { prices, ...prodData } = item;
    insertProd.run(prodData);

    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];
      insertPrice.run({
        id: `${item.id}-${p.store_slug}`,
        product_id: item.id,
        store_slug: p.store_slug,
        store_name: p.store_name,
        price: p.price,
        price_with_vat: Number((p.price * 1.21).toFixed(2)),
        in_stock: 1,
        store_url: p.store_url,
      });

      // Crear 4 puntos históricos para el gráfico
      for (let dayOffset = 30; dayOffset >= 0; dayOffset -= 10) {
        const hDate = new Date(now);
        hDate.setDate(hDate.getDate() - dayOffset);
        const dateStr = hDate.toISOString().split("T")[0];
        insertHist.run({
          id: `${item.id}-${p.store_slug}-${dayOffset}`,
          product_id: item.id,
          store_name: p.store_name,
          price: Number((p.price * (1 + (dayOffset % 3) * 0.04)).toFixed(2)),
          recorded_at: dateStr,
        });
      }
    }
  }
}

// ---- CONSULTAS RÁPIDAS ----

export function queryProducts({
  q = "",
  specialty = "",
  brand = "",
  store = "",
  sort = "price_asc",
  limit = 20,
  offset = 0,
}: {
  q?: string;
  specialty?: string;
  brand?: string;
  store?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  let where = "WHERE is_active = 1";
  const params: any = {};

  if (q.trim()) {
    where += " AND (name LIKE @q OR brand_name LIKE @q OR category_name LIKE @q OR ean LIKE @q OR manufacturer_ref LIKE @q)";
    params.q = `%${q.trim()}%`;
  }

  if (specialty) {
    where += " AND specialty_slug = @spec";
    params.spec = specialty.toLowerCase();
  }

  if (brand) {
    where += " AND (lower(brand_name) = lower(@brand) OR lower(brand_name) = lower(replace(@brand, '-', ' ')) OR lower(replace(replace(brand_name, ' ', '-'), '.', '')) = lower(@brand))";
    params.brand = brand;
  }

  if (store) {
    where += " AND EXISTS (SELECT 1 FROM product_prices WHERE product_id = products.id AND (store_slug = @store OR lower(store_name) = lower(@store)))";
    params.store = store.toLowerCase();
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products ${where}`).get(params) as { total: number };

  let orderBy = "min_price ASC";
  if (sort === "price_desc") orderBy = "min_price DESC";
  else if (sort === "name_asc") orderBy = "name ASC";
  else if (sort === "stores_desc") orderBy = "store_count DESC, min_price ASC";
  else if (sort === "savings") orderBy = "max_savings DESC, min_price ASC";

  const products = db.prepare(`
    SELECT id, name, slug, specialty_slug, category_name, brand_name, image_url, unit, min_price, min_price_store_name,
      (SELECT COUNT(*) FROM product_prices WHERE product_id = products.id) as store_count,
      (SELECT MAX(price) FROM product_prices WHERE product_id = products.id) as max_price,
      ROUND(COALESCE((SELECT MAX(price) FROM product_prices WHERE product_id = products.id), min_price) - min_price, 2) as max_savings
    FROM products
    ${where}
    ORDER BY ${orderBy}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  return { products, total: countRow.total };
}

export function queryProductBySlug(slug: string) {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, s.name as specialty_name, s.color as specialty_color
    FROM products p
    LEFT JOIN specialties s ON p.specialty_slug = s.slug
    WHERE p.slug = ? AND p.is_active = 1
  `).get(slug) as any;

  if (!product) return null;

  const prices = db.prepare(`
    SELECT id, store_slug, store_name, price, price_with_vat, in_stock, store_url, last_scraped
    FROM product_prices
    WHERE product_id = ?
    ORDER BY price ASC
  `).all(product.id);

  return { product, prices };
}

export function queryPriceHistory(productId: string, days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT store_name as store, price, recorded_at as date
    FROM price_history
    WHERE product_id = ? AND recorded_at >= date('now', '-' || ? || ' days')
    ORDER BY recorded_at ASC
  `).all(productId, days);
}

export function querySpecialties() {
  const db = getDb();
  return db.prepare("SELECT id, name, slug, color FROM specialties").all();
}

export function queryBrands() {
  const db = getDb();
  return db.prepare(`
    SELECT DISTINCT brand_name as name, lower(replace(replace(brand_name, ' ', '-'), '.', '')) as slug
    FROM products
    WHERE brand_name IS NOT NULL
    ORDER BY brand_name ASC
  `).all();
}

export function queryStores() {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, slug, url, shipping_free_from,
      (SELECT count(*) FROM product_prices WHERE store_slug = stores.slug) as offers_count
    FROM stores
    ORDER BY offers_count DESC
  `).all();
}
