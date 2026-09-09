# 🏥 MedicalChollo

**Comparador de precios de suministros médicos para profesionales en España.**

Compara precios de material dental, podología, oftalmología y más entre las principales tiendas online. Los precios se actualizan automáticamente cada 12 horas mediante scrapers automatizados.

## 💰 Modelo de negocio

- **Acceso libre**: Ver precio mínimo de cada producto
- **Suscripción 30€/mes**: Ver la tienda y el enlace directo de compra
- **7 días de prueba gratuita** sin tarjeta de crédito

---

## 🚀 Configuración inicial (paso a paso)

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```bash
cp .env.example .env.local
```

#### A) Supabase (base de datos + autenticación)
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratis
2. En **Settings > API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. En **Settings > Database > Connection string** copia la URL → `DATABASE_URL`

#### B) Ejecutar el schema de la base de datos
En **Supabase > SQL Editor**, pega y ejecuta el contenido de:
```
supabase/migrations/001_initial_schema.sql
```

#### C) Configurar Google OAuth (opcional pero recomendado)
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea credenciales OAuth 2.0
3. En Supabase > Authentication > Providers > Google, actívalo y pega tus credenciales

#### D) Stripe (suscripciones de pago)
1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. En **Developers > API keys**:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. En **Products**, crea un producto "Plan Profesional" con precio de 30€/mes
   - Copia el **Price ID** → `STRIPE_PRICE_ID`
4. En **Developers > Webhooks**, añade un endpoint:
   - URL: `https://tudominio.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
   - Copia el **Webhook secret** → `STRIPE_WEBHOOK_SECRET`

> Para desarrollo local, usa [Stripe CLI](https://stripe.com/docs/stripe-cli) para escuchar webhooks:
> ```bash
> stripe listen --forward-to localhost:3000/api/stripe/webhook
> ```

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🕷️ Sistema de Scrapers (Python)

Los scrapers extraen precios automáticamente de las tiendas.

### Instalar dependencias Python

```bash
cd scrapers
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
playwright install chromium
```

### Ejecutar scrapers manualmente

```bash
# Ejecutar solo Dentaltix
python stores/dentaltix_scraper.py

# Ejecutar solo Proclinic
python stores/proclinic_scraper.py

# Ejecutar el scheduler completo (todos + automatización cada 12h)
python scheduler.py
```

### Añadir nuevas tiendas

1. Crea un nuevo archivo en `scrapers/stores/` copiando `dentaltix_scraper.py`
2. Implementa los métodos `get_category_urls()`, `scrape_product_list()` y `scrape_product()`
3. Añade la nueva clase al array `SCRAPERS` en `scrapers/scheduler.py`
4. Añade la tienda a la tabla `stores` en Supabase

---

## 📁 Estructura del proyecto

```
MedicalChollo/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Layout raíz con Navbar y Footer
│   ├── buscar/page.tsx         # Buscador de productos
│   ├── producto/[slug]/        # Ficha de producto
│   ├── dashboard/page.tsx      # Panel de usuario
│   ├── login/page.tsx          # Login
│   ├── registro/page.tsx       # Registro
│   ├── suscripcion/page.tsx    # Página de precios
│   └── api/
│       ├── products/search/    # API de búsqueda
│       ├── products/[id]/      # API de precios e historial
│       └── stripe/             # Checkout, webhook, portal
│
├── components/
│   ├── ui/                     # Componentes base (Button, Card, Badge...)
│   ├── layout/                 # Navbar y Footer
│   ├── search/                 # Componente de búsqueda
│   ├── product/                # Tabla de precios y gráfico
│   └── dashboard/              # Botón gestión suscripción
│
├── lib/
│   ├── supabase/               # Clientes de Supabase (client/server)
│   ├── stripe.ts               # Cliente Stripe
│   └── utils.ts                # Utilidades (formatPrice, cn, etc.)
│
├── types/index.ts              # Tipos TypeScript globales
├── middleware.ts               # Protección de rutas autenticadas
│
└── scrapers/                   # Sistema Python de extracción de precios
    ├── base_scraper.py         # Clase base abstracta
    ├── matcher.py              # Motor de matching de productos
    ├── scheduler.py            # Automatización cada 12h
    ├── requirements.txt        # Dependencias Python
    └── stores/
        ├── dentaltix_scraper.py
        └── proclinic_scraper.py
```

---

## 🚀 Despliegue en producción

### Web (Next.js) → Vercel

1. Sube el código a GitHub
2. En [vercel.com](https://vercel.com), importa el repositorio
3. Añade todas las variables de entorno del `.env.local`
4. Deploy automático en cada push

### Scrapers (Python) → Railway

1. Crea una cuenta en [railway.app](https://railway.app)
2. Despliega desde la carpeta `scrapers/`
3. Añade las variables de entorno necesarias (`DATABASE_URL`)
4. El `scheduler.py` se ejecutará automáticamente cada 12 horas

---

## 🛣️ Próximas funcionalidades

- [ ] Alertas de bajada de precio por email
- [ ] Más tiendas: DVD Dental, Herbitas, Tedegal
- [ ] Scraper de Podología y Oftalmología
- [ ] Importación masiva de productos vía CSV/Excel
- [ ] API pública para tiendas afiliadas
- [ ] Panel de administración con métricas de scrapers
