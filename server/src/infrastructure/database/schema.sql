-- =========================================================================
-- ESQUEMA DE BASE DE DATOS PARA GESTIÓN DEL HOGAR (PostgreSQL / Supabase)
-- =========================================================================

-- 1. Tabla de Miembros del Hogar
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#3B82F6',
  monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  role VARCHAR(50) DEFAULT 'Miembro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Gastos (Compartidos del Hogar y Personales)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('SHARED', 'PERSONAL')),
  paid_by_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Suscripciones y Pagos Recurrentes
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  billing_day INT NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  type VARCHAR(20) NOT NULL CHECK (type IN ('SHARED', 'PERSONAL')),
  assigned_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category VARCHAR(50) DEFAULT 'Streaming / Servicios',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Inventario de Despensa y Alimentos (Rotación y Stock)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL DEFAULT 'unidades',
  min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (min_threshold >= 0),
  expiration_date DATE,
  location VARCHAR(50) NOT NULL DEFAULT 'Despensa',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Lista de Compras Inteligente
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit VARCHAR(30) NOT NULL DEFAULT 'unidades',
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  category VARCHAR(50) DEFAULT 'Supermercado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DATOS SEMILLA INICIALES (Opcional para pruebas en Supabase)
-- =========================================================================
INSERT INTO members (id, name, avatar_color, monthly_income, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Carlos (Papá)', '#3B82F6', 1400000, 'Padre'),
  ('22222222-2222-2222-2222-222222222222', 'Marcela (Mamá)', '#EC4899', 1250000, 'Madre'),
  ('33333333-3333-3333-3333-333333333333', 'Matías (Hijo)', '#10B981', 450000, 'Hijo')
ON CONFLICT (id) DO NOTHING;
