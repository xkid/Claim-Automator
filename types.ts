
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
  displayWidth?: 'half' | 'full';
  // Layout properties in millimeters (mm) relative to the A4 page
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
  };
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
