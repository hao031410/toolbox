const fallbackApiBaseUrl = 'http://localhost:3001';

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;

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
