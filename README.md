# HogarSync - Sistema de Gestion del Hogar

> Plataforma web para el control de finanzas compartidas familiares y rotacion inteligente de despensa y alimentos.
> Construida bajo los principios de Clean Architecture (Arquitectura Limpia) y principios SOLID utilizando React, Tailwind CSS, Node.js y TypeScript.

---

## 1. Descripcion General del Sistema

HogarSync aborda los desafios centrales de la administracion domestica moderna: optimizar la economia familiar mediante un pozo comun transparente y eliminar el desperdicio de comida mediante gestion inteligente de despensa (FIFO) y recetas adaptativas.

El sistema esta disenado con enfoque mobile-first como Progressive Web App (PWA) instalable en Android e iOS, ofreciendo navegacion nativa, sincronizacion en tiempo real y persistencia flexible tanto en memoria local para desarrollo como en PostgreSQL en la nube via Supabase.

---

## 2. Caracteristicas y Modulos Principales

### Modulo de Finanzas Familiares
- **Pozo Familiar Unificado:** Centraliza los ingresos mensuales de todos los miembros del hogar en un unico fondo comun consolidado.
- **Transparencia y Distribucion:** Visualizacion del porcentaje de aporte y contribucion economica neta de cada integrante.
- **Gastos Compartidos vs. Personales:**
  - **Compartidos (Hogar):** Arriendo, servicios basicos (luz, agua, internet, gas) y compras de provisiones; se descuentan directamente del pozo familiar.
  - **Personales:** Obligaciones individuales (creditos, telefonia personal, educacion, gimnasio) asignadas al integrante correspondiente.
- **Suscripciones Fijas:** Control de servicios recurrentes (streaming, almacenamiento, software) con dia de facturacion y tipificacion de titularidad.
- **Metricas e Indicadores Financieros:** Calculo en tiempo real de ingresos totales, gastos acumulados, fondo disponible y tasa proyectada de ahorro mensual.
- **Graficos de Distribucion:** Visualizacion por centros de costo (vivienda, alimentacion, servicios, etc.) y analisis de aportes netos versus obligaciones.

### Escaner Inteligente de Boletas con IA (Gemini Vision)
- **Digitalizacion OCR con Gemini AI:** Permite capturar o subir fotos de boletas y comprobantes de supermercado.
- **Extraccion Automatizada:** El modelo de vision artificial analiza la imagen y extrae el comercio, fecha, total y el desglose de productos (nombre, cantidad, unidad, precio y categoria sugerida).
- **Ingreso Simultaneo:** Con un solo clic registra tanto el gasto financiero como los productos en la despensa familiar.

### Modulo de Despensa e Inventario (Rotacion FIFO)
- **Control de Existencias:** Seguimiento de stock clasificado por ubicaciones fisicas (Refrigerador, Despensa, Congelador, Lavanderia).
- **Semaforo de Vencimiento FIFO (First In, First Out):** Deteccion automatica de productos criticos o proximos a expirar (menos de 3 dias) para priorizar su consumo.
- **Umbral de Stock Bajo:** Alertas preventivas cuando un articulo desciende por debajo de su cantidad minima recomendada.
- **Sugerencias de Recetas:** Catalogo dinamico de preparaciones culinarias que prioriza ingredientes con vencimiento inminente, permitiendo descontar los ingredientes utilizados del inventario con un clic.
- **Planificador Semanal de Comidas:** Organizacion de almuerzos y cenas de lunes a domingo para planificar las compras y optimizar el tiempo.

### Lista de Compras Inteligente
- **Autonutricion por Stock Bajo:** Los productos de la despensa que caen bajo su nivel minimo se anaden automaticamente a la lista de compras.
- **Articulos Manuales:** Opcion de anadir compras ocasionales con categoria y notas.
- **Reabastecimiento con 1 Clic:** Al marcar un item como comprado en el supermercado, el sistema actualiza automaticamente el stock en la despensa.

### Experiencia Movil y Android PWA
- **Mobile-First Bottom Navigation:** Barra de navegacion inferior nativa optimizada para pulgares en pantallas tactiles, con proteccion de safe-area insets y cero desplazamiento horizontal.
- **Soporte PWA Completo:** Web App Manifest conforme a los estandares de Android (iconos de 192x192, 512x512 y versiones maskable adaptativas).
- **Service Worker con Workbox:** Precache de activos estaticos y cache runtime para navegacion rapida.
- **Banner de Instalacion:** Flujo guiado de instalacion con proteccion contra ejecuciones concurrentes y deteccion de modo standalone (TWA, iOS y navegadores).

---

## 3. Arquitectura del Software (Clean Architecture & SOLID)

El sistema implementa una separacion rigurosa de responsabilidades:

```
gestion-hogar/
|-- client/                          # Frontend SPA (React 19, TypeScript, Tailwind CSS v4)
|   |-- src/
|   |   |-- components/              # Componentes funcionales desacoplados
|   |   |   |-- common/              # Modales, toasts y banners PWA
|   |   |   |-- finances/            # Dashboard financiero, graficos y membresias
|   |   |   |-- inventory/           # Despensa, planificador y recetas
|   |   |   |-- shopping/            # Lista de compras y abastecimiento
|   |   |   |-- summary/             # Resumen ejecutivo familiar
|   |   |   `-- Navbar.tsx           # Navegacion responsive (desktop y bottom mobile)
|   |   |-- context/                 # Contextos de React (PWA, Notificaciones)
|   |   |-- services/                # Cliente HTTP tipado con fallback dinamico
|   |   |-- types/                   # Definicion de contratos y DTOs TypeScript
|   |   |-- index.css                # Estilos globales con Tailwind CSS v4
|   |   `-- main.tsx                 # Entrada principal y providers
|   |-- public/                      # Manifest PWA, favicon SVG e iconos Android
|   `-- tests/                       # Suite de pruebas automatizadas
|
|-- server/                          # Backend API REST (Node.js, Express, TypeScript)
|   `-- src/
|       |-- domain/                  # Capa de Dominio (Entidades y Contratos puros)
|       |   |-- entities/            # Member, Expense, Subscription, InventoryItem, ShoppingItem
|       |   |-- interfaces/          # IReceiptScannerService
|       |   `-- repositories/        # IMemberRepository, IExpenseRepository, IInventoryRepository...
|       |-- application/             # Capa de Aplicacion (Casos de Uso del negocio)
|       |   `-- use-cases/           # GetFinancialSummary, ManageExpenses, ManageInventory...
|       |-- infrastructure/          # Capa de Infraestructura (Implementaciones externas)
|       |   |-- database/            # schema.sql (PostgreSQL) y cliente Supabase
|       |   |-- repositories/        # Implementaciones InMemory y Supabase PostgreSQL
|       |   `-- services/            # GeminiReceiptScannerService (Integracion Google AI)
|       `-- presentation/            # Capa de Presentacion (Controladores y Rutas HTTP)
|           |-- controllers/         # FinancialController, InventoryController
|           |-- routes/              # financeRoutes, inventoryRoutes
|           `-- server.ts            # Punto de composicion e inyeccion de dependencias
|
`-- README.md
```

### Principios SOLID Aplicados
- **Single Responsibility (SRP):** Cada caso de uso ejecuta una unica operacion de negocio aislada.
- **Open/Closed (OCP):** El sistema permite incorporar nuevos proveedores de persistencia (ej. MySQL o MongoDB) implementando las interfaces de repositorio existentes sin modificar los casos de uso.
- **Liskov Substitution (LSP):** Las implementaciones `InMemoryRepository` y `SupabaseRepository` son 100% intercambiables sin alterar la semantica del negocio.
- **Interface Segregation (ISP):** Repositorios pequenos y atomicos adaptados exclusivamente a las necesidades de cada entidad.
- **Dependency Inversion (DIP):** La logica de aplicacion depende unicamente de abstracciones (`domain/repositories`), mientras que las implementaciones de infraestructura se inyectan en el Composition Root (`server.ts`).

---

## 4. Variables de Entorno

El backend permite operar en modo local volatil (sin configuracion previa) o en modo persistente en la nube mediante un archivo `.env` en el directorio `server`:

```env
# Puerto del servidor backend (por defecto: 3001)
PORT=3001

# Conexion con Supabase (PostgreSQL en la nube)
# Si se omiten, el servidor utiliza almacenamiento en memoria local
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-o-service-key

# Clave de API de Google Gemini para el escaner inteligente de boletas
# Tambien puede ingresarse directamente desde la interfaz web del cliente
GEMINI_API_KEY=tu-gemini-api-key
```

---

## 5. Instalacion y Ejecucion Local

### Requisitos Previos
- Node.js version 18.0.0 o superior
- npm version 9.0.0 o superior

### Paso 1: Clonar e Instalar Dependencias
```bash
git clone https://github.com/TU_USUARIO/gestion-hogar.git
cd gestion-hogar

# Instalar dependencias raiz, del cliente y del servidor
npm run install:all
```

### Paso 2: Ejecucion en Modo Desarrollo
Para ejecutar el frontend y el backend de forma concurrente con recarga automatica:

```bash
npm run dev
```

Los servicios estaran disponibles en:
- **Cliente Web:** `http://localhost:5173`
- **Servidor API:** `http://localhost:3001`
- **Healthcheck API:** `http://localhost:3001/api/health`

---

## 6. Ejecucion de Pruebas

El proyecto cuenta con suites de pruebas unitarias y de integracion:

```bash
# Ejecutar la suite completa desde la raiz (cliente + servidor)
npm test

# O ejecutar pruebas individualmente en cada modulo:
cd client
npm test

cd ../server
npm test
```

Para verificar la compilacion y tipado estricto sin simbolos en desuso:

```bash
# Compilacion y comprobacion de tipos en el cliente
cd client
npm run build

# Compilacion y comprobacion de tipos en el servidor
cd ../server
npm run build
```

---

## 7. Despliegue en Produccion

### Base de Datos: Supabase (PostgreSQL)
1. Crear una cuenta gratuita en [supabase.com](https://supabase.com) y crear un nuevo proyecto.
2. Abrir el **SQL Editor** en el panel de Supabase.
3. Copiar y ejecutar el contenido del archivo `server/src/infrastructure/database/schema.sql`.
4. Copiar la **Project URL** y el **anon key** desde los ajustes del proyecto para configurar las variables de entorno.

### Backend: Render
1. Crear una cuenta en [render.com](https://render.com) y seleccionar **New Web Service**.
2. Vincular el repositorio Git del proyecto.
3. Configurar:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. En la seccion **Environment Variables**, definir:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GEMINI_API_KEY` (opcional)

### Frontend: Vercel
1. Crear una cuenta en [vercel.com](https://vercel.com) e importar el repositorio.
2. Configurar:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Al ingresar por primera vez a la URL de Vercel (ej. `https://mi-hogar.vercel.app`), utilizar el banner superior de configuracion para ingresar la URL del backend en Render (ej. `https://mi-backend.onrender.com`). La aplicacion guardara la configuracion y conectara de inmediato.
