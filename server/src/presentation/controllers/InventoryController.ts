import { Request, Response } from 'express';
import { ManageInventoryUseCase } from '../../application/use-cases/ManageInventoryUseCase';
import { ManageShoppingListUseCase } from '../../application/use-cases/ManageShoppingListUseCase';

export class InventoryController {
  constructor(
    private readonly inventoryUseCase: ManageInventoryUseCase,
    private readonly shoppingUseCase: ManageShoppingListUseCase
  ) {}

  public getInventory = async (req: Request, res: Response) => {
    try {
      const filter = {
        category: req.query.category as any,
        location: req.query.location as any,
        lowStockOnly: req.query.lowStock === 'true',
      };
      const items = await this.inventoryUseCase.getAll(filter);
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createInventoryItem = async (req: Request, res: Response) => {
    try {
      const item = await this.inventoryUseCase.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public adjustStock = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { delta } = req.body;
      const updated = await this.inventoryUseCase.adjustStock(id, Number(delta));
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteInventoryItem = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.inventoryUseCase.delete(id);
      res.json({ success: true, message: 'Producto eliminado del inventario' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getShoppingList = async (_req: Request, res: Response) => {
    try {
      const list = await this.shoppingUseCase.getAll();
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createShoppingItem = async (req: Request, res: Response) => {
    try {
      const item = await this.shoppingUseCase.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public toggleShoppingItem = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const autoRestock = req.body.autoRestock !== false;
      const updated = await this.shoppingUseCase.togglePurchased(id, autoRestock);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteShoppingItem = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.shoppingUseCase.delete(id);
      res.json({ success: true, message: 'Artículo eliminado de la lista' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public clearPurchased = async (_req: Request, res: Response) => {
    try {
      const count = await this.shoppingUseCase.clearPurchased();
      res.json({ success: true, message: `${count} artículos comprados eliminados` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
