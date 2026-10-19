# 🏡 HogarSync — Sistema de Gestión del Hogar

> **Plataforma web para el control de finanzas compartidas y rotación inteligente de despensa/alimentos.**
> Construida bajo los principios de **Clean Architecture** (Arquitectura Limpia) y principios **SOLID** utilizando **React, Tailwind CSS, Node.js y TypeScript**.

---

## 🎯 Objetivo del Proyecto

La aplicación resuelve dos problemas fundamentales en la convivencia del hogar para fomentar el ahorro y la organización:

### 1. Sección de Finanzas del Hogar (Transparencia & Ahorro)
- **Pozo Familiar Unificado:** Todos los ingresos/sueldos de los integrantes se contabilizan como un solo pozo común familiar.
- **Transparencia Individual:** Permite registrar y visualizar cuánto aporta cada integrante y su porcentaje del ingreso total.
- **Gastos Compartidos vs Personales:** 
  - **Compartidos (Hogar):** Arriendo, luz, agua, internet, compras del supermercado para la casa. Afectan directamente el pozo familiar.
  - **Personales:** Gastos obligatorios, créditos, planes telefónicos, gimnasio o suscripciones personales asignadas exclusivamente a quien corresponde.
- **Suscripciones Fijas:** Control de servicios mensuales (Netflix, Spotify, Google One, etc.) con día de cobro y asignación (familiar o individual).
- **Métricas Clave:** Ingreso total, fondo disponible restante, gastos totales y tasa de ahorro mensual proyectada.

### 2. Sección de Despensa y Rotación de Alimentos (Desperdicio Cero)
- **Control de Existencias:** Monitoreo en tiempo real de qué alimentos y artículos de aseo hay en casa y en qué ubicación (Refrigerador, Despensa, Congelador, Lavandería).
- **Alerta de Stock Bajo:** Avisa automáticamente cuando la cantidad actual es inferior al umbral mínimo recomendado.
- **Rotación FIFO (First In, First Out):** Detección de alimentos próximos a vencer (menos de 3 días) para consumirlos con prioridad y evitar botar comida y dinero a la basura.
- **Lista de Compras Inteligente:**
  - Se nutre automáticamente con los productos que tienen stock bajo.
  - Permite agregar artículos manuales.
  - **Reabastecimiento con 1 Clic:** Al marcar un producto como comprado en el supermercado, se suma automáticamente al stock de la despensa.

---

## 🏛️ Arquitectura Limpia (Clean Architecture) & Principios SOLID

El código del backend (`/server`) y frontend (`/client`) está desacoplado siguiendo arquitectura hexagonal / limpia:

```
gestion-hogar/
├── client/                     # Frontend: React 19 + TypeScript + Tailwind CSS v4
│   ├── src/
│   │   ├── components/         # Componentes UI desacoplados
│   │   │   ├── finances/       # Dashboard de sueldos, pozo familiar y gastos
│   │   │   ├── inventory/      # Despensa, semáforo de rotación y poco stock
│   │   │   ├── shopping/       # Lista de compras y autoreposición
│   │   │   ├── summary/        # Resumen ejecutivo familiar
│   │   │   └── cloud/          # Guía interactiva de conexión en la nube
│   │   ├── services/           # Cliente de API tipado
│   │   └── types/              # DTOs y modelos TypeScript
│   └── vite.config.ts
│
├── server/                     # Backend: Node.js + Express + TypeScript
│   ├── src/
│   │   ├── domain/             # CAPA DE DOMINIO (Reglas de negocio puras, sin frameworks)
│   │   │   ├── entities/       # Member, Expense, Subscription, InventoryItem, ShoppingItem
│   │   │   └── repositories/   # Interfaces (IMemberRepository, IExpenseRepository, etc.)
│   │   ├── application/        # CAPA DE APLICACIÓN (Casos de uso)
│   │   │   └── use-cases/      # GetFinancialSummary, ManageInventory, ManageExpenses...
│   │   ├── infrastructure/     # CAPA DE INFRAESTRUCTURA (Bases de datos y adaptadores)
│   │   │   ├── repositories/   # InMemory / Postgres Repositories
│   │   │   └── database/       # schema.sql para PostgreSQL/Supabase
│   │   └── presentation/       # CAPA DE PRESENTACIÓN (Controladores y Rutas HTTP)
│   │       ├── controllers/    # FinancialController, InventoryController
│   │       ├── routes/         # financeRoutes, inventoryRoutes
│   │       └── server.ts       # Punto de entrada / Composición de Dependencias (DIP)
│   └── tsconfig.json
│
├── package.json                # Scripts raíz para ejecución simultánea
└── README.md
```

### Aplicación de Principios SOLID:
- **S (Single Responsibility):** Cada caso de uso (`GetFinancialSummaryUseCase`, `ManageInventoryUseCase`) tiene una única responsabilidad y motivo de cambio.
- **O (Open/Closed):** La lógica de negocio está abierta a extensión mediante interfaces de repositorio y cerrada a modificación.
- **L (Liskov Substitution):** Cualquier implementación de repositorio (`InMemoryExpenseRepository`, `SupabaseExpenseRepository`) puede sustituir a otra sin alterar el comportamiento de la aplicación.
- **I (Interface Segregation):** Las interfaces son específicas y compactas (`IExpenseRepository`, `IInventoryRepository`).
- **D (Dependency Inversion):** Los casos de uso no dependen de bases de datos ni de Express; dependen de abstracciones (`src/domain/repositories`). Las dependencias se inyectan en el punto de composición (`server.ts`).

---

## ☁️ Recomendación de Base de Datos y Hosting en la Nube

Para una familia de **hasta 10 personas**, se busca mantener el sistema activo las 24 horas del día con costo **$0 USD**:

### Base de Datos Recomendada: **Supabase (PostgreSQL)**
1. **Plan Gratuito Permanente:** 500 MB de base de datos relacional (almacena millones de transacciones familiares sin costo).
2. **Alta Disponibilidad:** Hospedado en AWS con 99.9% de uptime, activo 24/7.
3. **Sincronización en Tiempo Real:** Permite que si alguien en el supermercado marca un producto como comprado, se refleje al instante en el teléfono de los demás en casa.
4. **Instalación Rápida:** 
   - Crea un proyecto gratuito en [supabase.com](https://supabase.com).
   - Ve a **SQL Editor** y pega el contenido del archivo [`server/src/infrastructure/database/schema.sql`](file:///C:/gestion-hogar/server/src/infrastructure/database/schema.sql).
   - ¡Listo! Las 5 tablas y relaciones quedarán creadas de inmediato.

*Alternativa:* **Neon.tech** (PostgreSQL Serverless gratuito con branching).

### Hosting de la Aplicación:
- **Frontend (Web):** Desplegar en **Vercel** o **Cloudflare Pages** conectando tu repositorio de GitHub. Ofrecen dominio HTTPS gratuito (ej: `mi-hogar.vercel.app`) y CDN global sin costo.
- **Backend (API):** Desplegar la carpeta `server` en **Render.com** (Web Service gratuito) o **Railway.app**.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### Requisitos previos:
- Node.js v18 o superior instalado.

### 1. Iniciar Frontend y Backend simultáneamente:
Desde la carpeta raíz `C:\gestion-hogar`:

```bash
npm run dev
```

Esto levantará:
- **Backend API:** `http://localhost:3001`
- **Frontend Web:** `http://localhost:5173`

Abre tu navegador en `http://localhost:5173`. Viene con datos iniciales de demostración para probar de inmediato todas las funciones.

---

## 🐙 Conectar con tu Cuenta de GitHub

El proyecto ya está inicializado con Git localmente en `C:\gestion-hogar`. Para subirlo a tu cuenta de GitHub:

1. Ingresa a [github.com/new](https://github.com/new) y crea un nuevo repositorio llamado `gestion-hogar` (puedes dejarlo público o privado).
2. En tu terminal ejecuta:

```bash
cd C:\gestion-hogar
git remote add origin https://github.com/TU_USUARIO_DE_GITHUB/gestion-hogar.git
git branch -M main
git push -u origin main
```
