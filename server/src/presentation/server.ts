import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Repositories (Infrastructure Layer)
import { InMemoryMemberRepository } from '../infrastructure/repositories/InMemoryMemberRepository';
import { InMemoryExpenseRepository } from '../infrastructure/repositories/InMemoryExpenseRepository';
import { InMemorySubscriptionRepository } from '../infrastructure/repositories/InMemorySubscriptionRepository';
import { InMemoryInventoryRepository } from '../infrastructure/repositories/InMemoryInventoryRepository';
import { InMemoryShoppingRepository } from '../infrastructure/repositories/InMemoryShoppingRepository';

// Use Cases (Application Layer)
import { GetFinancialSummaryUseCase } from '../application/use-cases/GetFinancialSummaryUseCase';
import { ManageMembersUseCase } from '../application/use-cases/ManageMembersUseCase';
import { ManageExpensesUseCase } from '../application/use-cases/ManageExpensesUseCase';
import { ManageSubscriptionsUseCase } from '../application/use-cases/ManageSubscriptionsUseCase';
import { ManageInventoryUseCase } from '../application/use-cases/ManageInventoryUseCase';
import { ManageShoppingListUseCase } from '../application/use-cases/ManageShoppingListUseCase';

// Controllers and Routers (Presentation Layer)
import { FinancialController } from './controllers/FinancialController';
import { InventoryController } from './controllers/InventoryController';
import { createFinanceRouter } from './routes/financeRoutes';
import { createInventoryRouter } from './routes/inventoryRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors());
app.use(express.json());

// =========================================================================
// COMPOSITION ROOT / DEPENDENCY INJECTION (DIP - SOLID)
// =========================================================================

// 1. Repositories Instantiation
const memberRepo = new InMemoryMemberRepository();
const expenseRepo = new InMemoryExpenseRepository();
const subscriptionRepo = new InMemorySubscriptionRepository();
const inventoryRepo = new InMemoryInventoryRepository();
const shoppingRepo = new InMemoryShoppingRepository();

// 2. Use Cases Instantiation
const summaryUseCase = new GetFinancialSummaryUseCase(memberRepo, expenseRepo, subscriptionRepo);
const membersUseCase = new ManageMembersUseCase(memberRepo);
const expensesUseCase = new ManageExpensesUseCase(expenseRepo, memberRepo);
const subscriptionsUseCase = new ManageSubscriptionsUseCase(subscriptionRepo, memberRepo);

const inventoryUseCase = new ManageInventoryUseCase(inventoryRepo, shoppingRepo);
const shoppingUseCase = new ManageShoppingListUseCase(shoppingRepo, inventoryRepo);

// 3. Controllers Instantiation
const financialController = new FinancialController(
  summaryUseCase,
  membersUseCase,
  expensesUseCase,
  subscriptionsUseCase
);

const inventoryController = new InventoryController(inventoryUseCase, shoppingUseCase);

// 4. Routes Registration
app.use('/api/finances', createFinanceRouter(financialController));
app.use('/api/inventory', createInventoryRouter(inventoryController));

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Gestión del Hogar API',
    architecture: 'Clean Architecture (SOLID)',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` 🏡 Servidor de Gestión del Hogar Iniciado`);
  console.log(` 🚀 Escuchando en: http://localhost:${PORT}`);
  console.log(` 📦 API Finanzas:   http://localhost:${PORT}/api/finances/summary`);
  console.log(` 🍏 API Despensa:   http://localhost:${PORT}/api/inventory/items`);
  console.log(`=================================================`);
});

export default app;
