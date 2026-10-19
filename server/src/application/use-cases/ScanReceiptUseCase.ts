import {
  IReceiptScannerService,
  ScannedReceiptResultDTO,
} from '../../domain/interfaces/IReceiptScannerService';

export class ScanReceiptUseCase {
  constructor(private readonly scannerService: IReceiptScannerService) {}

  public async execute(imageBase64: string, customApiKey?: string): Promise<ScannedReceiptResultDTO> {
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('La imagen de la boleta es requerida y debe estar codificada en Base64.');
    }

    return this.scannerService.scanReceipt(imageBase64, customApiKey);
  }
}
