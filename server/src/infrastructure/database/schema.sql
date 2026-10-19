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
-- POLÍTICAS DE ACCESO (Permitir lectura y escritura a la aplicación)
-- =========================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a members" ON members;
CREATE POLICY "Acceso total a members" ON members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a expenses" ON expenses;
CREATE POLICY "Acceso total a expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a subscriptions" ON subscriptions;
CREATE POLICY "Acceso total a subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a inventory_items" ON inventory_items;
CREATE POLICY "Acceso total a inventory_items" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a shopping_items" ON shopping_items;
CREATE POLICY "Acceso total a shopping_items" ON shopping_items FOR ALL USING (true) WITH CHECK (true);
