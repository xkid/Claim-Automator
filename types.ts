
export interface Receipt {
  id: string;
  image: string; // Base64
  croppedImage?: string; // Base64
  amount: number;
  merchant: string;
  date: string;
  category: string;
  remark?: string;
  isProcessing: boolean;
}

export interface ClaimState {
  name: string;
  month: string;
  receipts: Receipt[];
  categories: string[];
}

export interface GeminiAnalysisResponse {
  amount: number;
  merchant: string;
  date: string;
  suggestedCategory: string;
}
