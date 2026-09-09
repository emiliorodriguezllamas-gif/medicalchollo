-- ============================================================
-- MedicalChollo — Schema Inicial de Base de Datos
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda fuzzy

-- ============================================================
-- TABLA: specialties (Especialidades médicas)
-- ============================================================
CREATE TABLE specialties (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL UNIQUE,     -- "Dental", "Podología", "Oftalmología"
  slug      TEXT NOT NULL UNIQUE,     -- "dental", "podologia", "oftalmologia"
  icon      TEXT,                     -- nombre del icono (lucide)
  color     TEXT,                     -- color hex para UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO specialties (name, slug, icon, color) VALUES
  ('Dental',       'dental',       'tooth',       '#2563EB'),
  ('Podología',    'podologia',    'footprints',  '#16A34A'),
  ('Oftalmología', 'oftalmologia', 'eye',         '#9333EA'),
  ('Medicina',     'medicina',     'stethoscope', '#DC2626');

-- ============================================================
-- TABLA: stores (Tiendas/Proveedores)
-- ============================================================
CREATE TABLE stores (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,    -- "Dentaltix"
  slug         TEXT NOT NULL UNIQUE,    -- "dentaltix"
  url          TEXT NOT NULL,           -- "https://www.dentaltix.com"
  logo_url     TEXT,
  country      TEXT DEFAULT 'ES',
  is_active    BOOLEAN DEFAULT TRUE,
  shipping_free_from DECIMAL(10,2),    -- Umbral de envío gratis (ej: 99.00)
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO stores (name, slug, url, shipping_free_from) VALUES
  ('Dentaltix',  'dentaltix',  'https://www.dentaltix.com',  99.00),
  ('Proclinic',  'proclinic',  'https://www.proclinic.es',   75.00),
  ('DVD Dental', 'dvd-dental', 'https://www.dvd-dental.com', 80.00);

-- ============================================================
-- TABLA: brands (Marcas de productos)
-- ============================================================
CREATE TABLE brands (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: categories (Categorías de productos)
-- ============================================================
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty_id  UUID REFERENCES specialties(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  parent_id     UUID REFERENCES categories(id),  -- Para subcategorías
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(specialty_id, slug)
);

-- Categorías dentales iniciales
INSERT INTO categories (specialty_id, name, slug)
SELECT id, name, slug FROM specialties s,
  (VALUES
    ('Anestesia', 'anestesia'),
    ('Composites y Adhesivos', 'composites-adhesivos'),
    ('Desechables y Consumibles', 'desechables-consumibles'),
    ('Guantes', 'guantes'),
    ('Fresas y Brocas', 'fresas-brocas'),
    ('Endodoncia', 'endodoncia'),
    ('Radiología', 'radiologia'),
    ('Higiene Oral', 'higiene-oral'),
    ('Equipamiento', 'equipamiento'),
    ('Instrumental', 'instrumental')
  ) AS cats(name, slug)
WHERE s.slug = 'dental';

-- ============================================================
-- TABLA: products (Catálogo Maestro de Productos)
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty_id    UUID REFERENCES specialties(id),
  category_id     UUID REFERENCES categories(id),
  brand_id        UUID REFERENCES brands(id),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  ean             TEXT,               -- Código de barras EAN-13
  manufacturer_ref TEXT,             -- Referencia del fabricante
  image_url       TEXT,
  unit            TEXT,              -- "caja 100 uds", "frasco 250ml", etc.
  is_active       BOOLEAN DEFAULT TRUE,
  -- Precio mínimo actual (desnormalizado para rendimiento)
  min_price       DECIMAL(10,2),
  min_price_store_id UUID REFERENCES stores(id),
  -- Búsqueda de texto completo
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX products_search_idx ON products USING GIN(search_vector);
CREATE INDEX products_ean_idx ON products(ean) WHERE ean IS NOT NULL;
CREATE INDEX products_manufacturer_ref_idx ON products(manufacturer_ref) WHERE manufacturer_ref IS NOT NULL;
CREATE INDEX products_specialty_idx ON products(specialty_id);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_min_price_idx ON products(min_price);

-- Función para actualizar el vector de búsqueda
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.ean, '') || ' ' ||
    COALESCE(NEW.manufacturer_ref, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ============================================================
-- TABLA: product_prices (Precio actual por tienda)
-- ============================================================
CREATE TABLE product_prices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price        DECIMAL(10,2) NOT NULL,      -- Precio sin IVA
  price_with_vat DECIMAL(10,2),            -- Precio con IVA (21% médico)
  currency     TEXT DEFAULT 'EUR',
  in_stock     BOOLEAN DEFAULT TRUE,
  stock_qty    INTEGER,                     -- Cantidad en stock (si disponible)
  store_url    TEXT NOT NULL,               -- URL directa al producto en la tienda
  store_sku    TEXT,                        -- SKU interno de la tienda
  last_scraped TIMESTAMPTZ DEFAULT NOW(),   -- Última vez que se rastreó
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

CREATE INDEX product_prices_product_idx ON product_prices(product_id);
CREATE INDEX product_prices_store_idx ON product_prices(store_id);
CREATE INDEX product_prices_price_idx ON product_prices(price);
CREATE INDEX product_prices_in_stock_idx ON product_prices(in_stock);

-- ============================================================
-- TABLA: price_history (Histórico de precios)
-- ============================================================
CREATE TABLE price_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price        DECIMAL(10,2) NOT NULL,
  in_stock     BOOLEAN DEFAULT TRUE,
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX price_history_product_store_idx ON price_history(product_id, store_id);
CREATE INDEX price_history_recorded_at_idx ON price_history(recorded_at DESC);

-- ============================================================
-- TABLA: profiles (Perfiles de usuario — extiende Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  clinic_name     TEXT,           -- Nombre de la clínica
  specialty       TEXT,           -- Especialidad principal
  phone           TEXT,
  stripe_customer_id TEXT UNIQUE, -- ID de cliente en Stripe
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: subscriptions (Estado de suscripción Stripe)
-- ============================================================
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id     TEXT,
  status              TEXT NOT NULL DEFAULT 'inactive',
  -- Estados: 'trialing', 'active', 'past_due', 'canceled', 'inactive'
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX subscriptions_user_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);

-- ============================================================
-- FUNCIÓN: Actualizar min_price en products
-- Se ejecuta automáticamente cuando cambia un product_price
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_product_min_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    min_price = subq.min_price,
    min_price_store_id = subq.store_id,
    updated_at = NOW()
  FROM (
    SELECT
      product_id,
      store_id,
      price AS min_price,
      ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY price ASC) AS rn
    FROM product_prices
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND in_stock = TRUE
      AND is_active = TRUE
  ) subq
  WHERE subq.rn = 1
    AND products.id = subq.product_id;

  -- Si no hay precios en stock, poner NULL
  UPDATE products
  SET min_price = NULL, min_price_store_id = NULL
  WHERE id = COALESCE(NEW.product_id, OLD.product_id)
    AND NOT EXISTS (
      SELECT 1 FROM product_prices
      WHERE product_id = products.id AND in_stock = TRUE AND is_active = TRUE
    );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_min_price_on_price_change
  AFTER INSERT OR UPDATE OR DELETE ON product_prices
  FOR EACH ROW EXECUTE FUNCTION refresh_product_min_price();

-- ============================================================
-- FUNCIÓN: Guardar historial cuando cambia el precio
-- ============================================================
CREATE OR REPLACE FUNCTION save_price_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo guardar si el precio cambió
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.price != NEW.price) THEN
    INSERT INTO price_history (product_id, store_id, price, in_stock)
    VALUES (NEW.product_id, NEW.store_id, NEW.price, NEW.in_stock);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER save_price_history_trigger
  AFTER INSERT OR UPDATE ON product_prices
  FOR EACH ROW EXECUTE FUNCTION save_price_history();

-- ============================================================
-- TABLA: scraper_logs (Logs del sistema de scraping)
-- ============================================================
CREATE TABLE scraper_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID REFERENCES stores(id),
  status      TEXT NOT NULL,   -- 'success', 'error', 'partial'
  products_scraped INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  error_message TEXT,
  duration_seconds DECIMAL(10,2),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- ============================================================
-- VISTA: v_product_comparison (Vista principal del comparador)
-- ============================================================
CREATE VIEW v_product_comparison AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  p.image_url,
  p.unit,
  p.ean,
  p.manufacturer_ref,
  s.id AS specialty_id,
  s.name AS specialty_name,
  c.name AS category_name,
  b.name AS brand_name,
  pp.store_id,
  st.name AS store_name,
  st.logo_url AS store_logo,
  pp.price,
  pp.price_with_vat,
  pp.in_stock,
  pp.store_url,
  pp.last_scraped,
  p.min_price,
  RANK() OVER (PARTITION BY p.id ORDER BY pp.price ASC) AS price_rank,
  (pp.price = p.min_price) AS is_best_price
FROM products p
LEFT JOIN specialties s ON p.specialty_id = s.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.is_active = TRUE AND pp.in_stock = TRUE
LEFT JOIN stores st ON pp.store_id = st.id AND st.is_active = TRUE
WHERE p.is_active = TRUE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de perfiles (solo el propio usuario puede ver/editar su perfil)
CREATE POLICY "Profiles: own profile read" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: own profile update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas de suscripciones (solo el propio usuario)
CREATE POLICY "Subscriptions: own subscription read" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Productos y precios son públicos (lectura)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products: public read" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Stores: public read" ON stores FOR SELECT USING (is_active = TRUE);

-- Los precios (incluyendo URLs) solo para usuarios con suscripción activa
-- Los precios en sí son públicos; la URL de compra se controla en la API
CREATE POLICY "Prices: public read" ON product_prices FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- FUNCIÓN: Crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
