import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';

export function createInventoryRouter(controller: InventoryController): Router {
  const router = Router();

  // Inventory & Pantry
  router.get('/items', controller.getInventory);
  router.post('/items', controller.createInventoryItem);
  router.patch('/items/:id/stock', controller.adjustStock);
  router.delete('/items/:id', controller.deleteInventoryItem);

  // Smart Shopping List
  router.get('/shopping', controller.getShoppingList);
  router.post('/shopping', controller.createShoppingItem);
  router.patch('/shopping/:id/toggle', controller.toggleShoppingItem);
  router.delete('/shopping/:id', controller.deleteShoppingItem);
  router.delete('/shopping/actions/clear-purchased', controller.clearPurchased);

  // Gemini AI Chilean Recipe Suggestions
  router.post('/suggest-recipes', controller.suggestRecipes);

  return router;
}
