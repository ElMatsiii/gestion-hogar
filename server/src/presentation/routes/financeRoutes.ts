import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';

export function createFinanceRouter(controller: FinancialController): Router {
  const router = Router();

  // Summary
  router.get('/summary', controller.getSummary);

  // Members
  router.get('/members', controller.getMembers);
  router.post('/members', controller.createMember);
  router.put('/members/:id/income', controller.updateMemberIncome);

  // Expenses
  router.get('/expenses', controller.getExpenses);
  router.post('/expenses', controller.createExpense);
  router.delete('/expenses/:id', controller.deleteExpense);

  // Subscriptions
  router.get('/subscriptions', controller.getSubscriptions);
  router.post('/subscriptions', controller.createSubscription);
  router.patch('/subscriptions/:id/toggle', controller.toggleSubscription);
  router.delete('/subscriptions/:id', controller.deleteSubscription);

  return router;
}
