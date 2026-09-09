// ============================================================
// MedicalChollo — Tipos TypeScript Globales
// ============================================================

// ---- Especialidades ----
export type Specialty = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  created_at: string;
};

// ---- Tiendas ----
export type Store = {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  country: string;
  is_active: boolean;
  shipping_free_from: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Marcas ----
export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

// ---- Categorías ----
export type Category = {
  id: string;
  specialty_id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

// ---- Productos ----
export type Product = {
  id: string;
  specialty_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  ean: string | null;
  manufacturer_ref: string | null;
  image_url: string | null;
  unit: string | null;
  is_active: boolean;
  min_price: number | null;
  min_price_store_id: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones (JOIN)
  specialty?: Specialty;
  category?: Category;
  brand?: Brand;
  min_price_store?: Store;
};

// ---- Precio de un Producto en una Tienda ----
export type ProductPrice = {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  price_with_vat: number | null;
  currency: string;
  in_stock: boolean;
  stock_qty: number | null;
  store_url: string;
  store_sku: string | null;
  last_scraped: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  store?: Store;
};

// ---- Historial de Precios ----
export type PriceHistory = {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  in_stock: boolean;
  recorded_at: string;
  store?: Store;
};

// ---- Perfil de Usuario ----
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  clinic_name: string | null;
  specialty: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Suscripción ----
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "inactive";

export type Subscription = {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

// ---- Vista de comparación (v_product_comparison) ----
export type ProductComparison = {
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  unit: string | null;
  ean: string | null;
  manufacturer_ref: string | null;
  specialty_id: string | null;
  specialty_name: string | null;
  category_name: string | null;
  brand_name: string | null;
  store_id: string | null;
  store_name: string | null;
  store_logo: string | null;
  price: number | null;
  price_with_vat: number | null;
  in_stock: boolean | null;
  store_url: string | null; // Solo se devuelve a suscriptores
  last_scraped: string | null;
  min_price: number | null;
  price_rank: number | null;
  is_best_price: boolean | null;
};

// ---- Respuesta de la API (con/sin suscripción) ----
export type ProductSearchResult = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  unit: string | null;
  specialty_name: string | null;
  category_name: string | null;
  brand_name: string | null;
  min_price: number | null;
  max_price?: number | null;
  max_savings?: number | null;
  store_count: number;
  // Solo para suscriptores activos:
  min_price_store_name?: string;
  min_price_store_url?: string; // La URL de compra real
};

export type PriceEntry = {
  store_id: string;
  store_name: string;
  store_logo: string | null;
  price: number;
  price_with_vat: number | null;
  in_stock: boolean;
  last_scraped: string;
  is_best_price: boolean;
  price_rank: number;
  // Solo para suscriptores:
  store_url?: string;
};

// ---- Logs del scraper ----
export type ScraperLog = {
  id: string;
  store_id: string | null;
  status: "success" | "error" | "partial";
  products_scraped: number;
  products_updated: number;
  error_message: string | null;
  duration_seconds: number | null;
  started_at: string;
  finished_at: string | null;
};

// ---- Tipos de la base de datos (para Supabase) ----
export type Database = {
  public: {
    Tables: {
      specialties: { Row: Specialty; Insert: Partial<Specialty>; Update: Partial<Specialty> };
      stores: { Row: Store; Insert: Partial<Store>; Update: Partial<Store> };
      brands: { Row: Brand; Insert: Partial<Brand>; Update: Partial<Brand> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_prices: { Row: ProductPrice; Insert: Partial<ProductPrice>; Update: Partial<ProductPrice> };
      price_history: { Row: PriceHistory; Insert: Partial<PriceHistory>; Update: Partial<PriceHistory> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> };
      scraper_logs: { Row: ScraperLog; Insert: Partial<ScraperLog>; Update: Partial<ScraperLog> };
    };
    Views: {
      v_product_comparison: { Row: ProductComparison };
    };
  };
};
