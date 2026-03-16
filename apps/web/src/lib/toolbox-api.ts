const fallbackApiBaseUrl = '/api';

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;

export type OcrInvoiceTaskFile = {
  id: string;
  name: string;
  relativePath: string;
  extension: string;
  mimeType: string;
  size: number;
  kind: 'zip' | 'pdf' | 'image' | 'unsupported';
  status: 'parsed' | 'pending_ocr' | 'ignored' | 'failed';
  note: string;
  pageCount?: number;
  extractedText?: string;
  extractedTextPreview?: string;
  ocrProvider?: string;
  ocrModel?: string;
  duplicate?: {
    type: 'exact' | 'possible';
    reason: string;
    matchedFileIds: string[];
  };
  invoice?: {
    invoiceType?: string;
    invoiceNo?: string;
    issueDate?: string;
    buyerName?: string;
    sellerName?: string;
    amountWithoutTax?: string;
    taxAmount?: string;
    totalAmount?: string;
    category?: '餐饮' | '交通' | '住宿' | '办公' | '服务' | '其他';
  };
};

export type OcrInvoiceTaskResult = {
  taskId: string;
  uploadedFileName: string;
  rootKind: 'zip' | 'pdf' | 'image' | 'unsupported';
  summary: {
    totalFiles: number;
    supportedFiles: number;
    ignoredFiles: number;
    queuedFiles: number;
    reviewFiles: number;
    duplicateFiles: number;
  };
  sourceFiles: OcrInvoiceTaskFile[];
};

export type LanTransferSession = {
  sessionId: string;
  clientId: string;
  joinCode: string;
  expiresAt: string;
};

export type LanTransferMessage = {
  cursor: number;
  senderId: string;
  type: string;
  payload?: unknown;
  createdAt: string;
};

export function createDeviceId() {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'toolbox-device-id';
  const saved = window.localStorage.getItem(storageKey);

  if (saved) {
    return saved;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(storageKey, next);
  return next;
}

export function buildCalculatorHistoryUrl(deviceId: string) {
  return `${apiBaseUrl}/calculator/histories?deviceId=${encodeURIComponent(
    deviceId,
  )}`;
}

export function getClientName() {
  if (typeof window === 'undefined') {
    return 'Unknown Device';
  }

  const navigatorWithUAData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    navigatorWithUAData.userAgentData?.platform || navigator.platform || '';

  if (/iphone/i.test(navigator.userAgent)) {
    return 'iPhone';
  }
  if (/ipad/i.test(navigator.userAgent)) {
    return 'iPad';
  }
  if (/android/i.test(navigator.userAgent)) {
    return 'Android';
  }
  if (/mac/i.test(platform)) {
    return 'Mac';
  }
  if (/win/i.test(platform)) {
    return 'Windows PC';
  }

  return 'Browser Device';
}

export async function createLanTransferSession(clientName: string) {
  const response = await fetch(`${apiBaseUrl}/lan-transfer/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientName }),
  });

  if (!response.ok) {
    throw new Error('创建连接失败。');
  }

  return (await response.json()) as LanTransferSession;
}

export async function joinLanTransferSession(
  joinCode: string,
  clientName: string,
) {
  const response = await fetch(`${apiBaseUrl}/lan-transfer/sessions/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ joinCode, clientName }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload?.message.join('，')
      : payload?.message;
    throw new Error(message || '加入连接失败。');
  }

  return (await response.json()) as LanTransferSession;
}

export async function pollLanTransferMessages(
  sessionId: string,
  clientId: string,
  cursor: number,
) {
  const response = await fetch(
    `${apiBaseUrl}/lan-transfer/sessions/${sessionId}/messages?clientId=${encodeURIComponent(clientId)}&cursor=${cursor}`,
  );

  if (!response.ok) {
    throw new Error('轮询会话消息失败。');
  }

  return (await response.json()) as {
    messages: LanTransferMessage[];
    nextCursor: number;
    expiresAt: string;
  };
}

export async function sendLanTransferMessage(
  sessionId: string,
  clientId: string,
  type: string,
  payload?: unknown,
) {
  const response = await fetch(
    `${apiBaseUrl}/lan-transfer/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, type, payload }),
    },
  );

  if (!response.ok) {
    throw new Error('发送会话消息失败。');
  }
}

export async function uploadOcrInvoiceTask(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/ocr-invoice/tasks/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('分析服务不可用，请确认后端已启动在 3001 端口。');
  }

  if (!response.ok) {
    const fallbackMessage = '上传失败，请检查文件格式或大小。';

    try {
      const payload = (await response.json()) as { message?: string | string[] };
      const message = Array.isArray(payload.message)
        ? payload.message.join('，')
        : payload.message;
      throw new Error(message || fallbackMessage);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  return (await response.json()) as OcrInvoiceTaskResult;
}
