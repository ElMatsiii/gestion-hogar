import { Request, Response } from 'express';
import { GetFinancialSummaryUseCase } from '../../application/use-cases/GetFinancialSummaryUseCase';
import { ManageMembersUseCase } from '../../application/use-cases/ManageMembersUseCase';
import { ManageExpensesUseCase } from '../../application/use-cases/ManageExpensesUseCase';
import { ManageSubscriptionsUseCase } from '../../application/use-cases/ManageSubscriptionsUseCase';
import { ScanReceiptUseCase } from '../../application/use-cases/ScanReceiptUseCase';

export class FinancialController {
  constructor(
    private readonly summaryUseCase: GetFinancialSummaryUseCase,
    private readonly membersUseCase: ManageMembersUseCase,
    private readonly expensesUseCase: ManageExpensesUseCase,
    private readonly subscriptionsUseCase: ManageSubscriptionsUseCase,
    private readonly scanReceiptUseCase?: ScanReceiptUseCase
  ) {}

  public getSummary = async (req: Request, res: Response) => {
    try {
      const month = typeof req.query.month === 'string' ? req.query.month : undefined;
      const summary = await this.summaryUseCase.execute(month);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getMembers = async (_req: Request, res: Response) => {
    try {
      const members = await this.membersUseCase.getAll();
      res.json({ success: true, data: members });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createMember = async (req: Request, res: Response) => {
    try {
      const member = await this.membersUseCase.create(req.body);
      res.status(201).json({ success: true, data: member });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public updateMember = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await this.membersUseCase.update(id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public updateMemberIncome = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { monthlyIncome } = req.body;
      const updated = await this.membersUseCase.updateIncome(id, monthlyIncome);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteMember = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.membersUseCase.delete(id);
      res.json({ success: true, message: 'Integrante eliminado exitosamente' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getExpenses = async (req: Request, res: Response) => {
    try {
      const filter = {
        type: req.query.type as any,
        memberId: typeof req.query.memberId === 'string' ? req.query.memberId : undefined,
        startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
        endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
      };
      const expenses = await this.expensesUseCase.getAll(filter);
      res.json({ success: true, data: expenses });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createExpense = async (req: Request, res: Response) => {
    try {
      const expense = await this.expensesUseCase.create(req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteExpense = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.expensesUseCase.delete(id);
      res.json({ success: true, message: 'Gasto eliminado exitosamente' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getSubscriptions = async (_req: Request, res: Response) => {
    try {
      const subs = await this.subscriptionsUseCase.getAll();
      res.json({ success: true, data: subs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createSubscription = async (req: Request, res: Response) => {
    try {
      const sub = await this.subscriptionsUseCase.create(req.body);
      res.status(201).json({ success: true, data: sub });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public toggleSubscription = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await this.subscriptionsUseCase.toggleActive(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteSubscription = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.subscriptionsUseCase.delete(id);
      res.json({ success: true, message: 'Suscripción eliminada' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public scanReceipt = async (req: Request, res: Response) => {
    try {
      if (!this.scanReceiptUseCase) {
        return res.status(501).json({
          success: false,
          error: 'El servicio de escaneo con IA no está configurado en el servidor.',
        });
      }

      const imageBase64 = req.body?.imageBase64 || req.body?.image;
      const apiKey = req.body?.apiKey;
      const customApiKey =
        (typeof req.headers['x-gemini-key'] === 'string' ? req.headers['x-gemini-key'] : undefined) ||
        apiKey;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió la imagen de la boleta. Asegúrate de subir una foto válida.',
        });
      }

      const result = await this.scanReceiptUseCase.execute(imageBase64, customApiKey);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
