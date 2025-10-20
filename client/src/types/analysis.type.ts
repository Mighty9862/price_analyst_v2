export interface PriceAnalysisResult {
  barcode: string;
  quantity: number;
  productName: string | null;
  supplierName: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  requiresManualProcessing: boolean;
  message: string;
}

export interface SupplierInfo {
  name: string;
  inn: string;
  address: string;
  phone: string;
  email: string;
}

export interface SupplierGroup {
  supplierName: string;
  supplierInfo: SupplierInfo | null;
  products: PriceAnalysisResult[];
  totalCost: number;
  productCount: number;
}

export interface AnalysisStats {
  totalRequested: number;
  totalFound: number;
  manualProcessingCount: number;
  totalCost: number;
}

export interface UserRequest {
  id: number;
  timestamp: string;
  requestDetails: string;
  responseDetails: PriceAnalysisResult[];
}