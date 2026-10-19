export interface ScannedItemDTO {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  location: string;
}

export interface ScannedReceiptResultDTO {
  storeName: string;
  date: string;
  totalAmount: number;
  items: ScannedItemDTO[];
}

export interface IReceiptScannerService {
  scanReceipt(imageBase64: string, customApiKey?: string): Promise<ScannedReceiptResultDTO>;
}
