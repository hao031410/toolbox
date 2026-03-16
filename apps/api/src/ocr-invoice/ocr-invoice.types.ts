export type OcrInvoiceSourceKind = 'zip' | 'pdf' | 'image' | 'unsupported';

export type OcrInvoiceCategory =
  | '餐饮'
  | '交通'
  | '住宿'
  | '办公'
  | '服务'
  | '其他';

export type OcrInvoiceExtractedFields = {
  invoiceType?: string;
  invoiceNo?: string;
  issueDate?: string;
  buyerName?: string;
  sellerName?: string;
  amountWithoutTax?: string;
  taxAmount?: string;
  totalAmount?: string;
  category?: OcrInvoiceCategory;
};

export type OcrInvoiceDuplicateInfo = {
  type: 'exact' | 'possible';
  reason: string;
  matchedFileIds: string[];
};

export type OcrInvoiceSourceFile = {
  id: string;
  name: string;
  relativePath: string;
  extension: string;
  mimeType: string;
  size: number;
  kind: OcrInvoiceSourceKind;
  status: 'parsed' | 'pending_ocr' | 'ignored' | 'failed';
  note: string;
  pageCount?: number;
  extractedText?: string;
  extractedTextPreview?: string;
  ocrProvider?: string;
  ocrModel?: string;
  invoice?: OcrInvoiceExtractedFields;
  duplicate?: OcrInvoiceDuplicateInfo;
};

export type OcrInvoiceTaskResult = {
  taskId: string;
  uploadedFileName: string;
  rootKind: OcrInvoiceSourceKind;
  summary: {
    totalFiles: number;
    supportedFiles: number;
    ignoredFiles: number;
    queuedFiles: number;
    reviewFiles: number;
    duplicateFiles: number;
  };
  sourceFiles: OcrInvoiceSourceFile[];
};
