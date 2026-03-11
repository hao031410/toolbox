'use client';

import { useEffect, useState } from 'react';

const storageKey = 'toolbox-theme';

function resolveTheme(preference: string) {
  if (preference === 'dark' || preference === 'light') {
    return preference;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const saved = window.localStorage.getItem(storageKey) || 'system';
    return resolveTheme(saved) as 'light' | 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(storageKey, next);
        document.documentElement.dataset.theme = next;
        setTheme(next);
      }}
    />
  );
}
