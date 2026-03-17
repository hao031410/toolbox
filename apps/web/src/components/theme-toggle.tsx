'use client';

import { useEffect, useState } from 'react';

const storageKey = 'toolbox-theme';

function resolveTheme(preference: string | null) {
  if (preference === 'dark' || preference === 'light') {
    return preference;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const rootTheme = document.documentElement.dataset.theme;
    return (rootTheme === 'dark' || rootTheme === 'light'
      ? rootTheme
      : resolveTheme(window.localStorage.getItem(storageKey))) as 'light' | 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const saved = window.localStorage.getItem(storageKey);

      if (saved === 'dark' || saved === 'light') {
        return;
      }

      const systemTheme = resolveTheme(saved) as 'light' | 'dark';
      applyTheme(systemTheme);
      setTheme(systemTheme);
    };

    applyTheme(theme);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      type="button"
      suppressHydrationWarning
      aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(storageKey, next);
        applyTheme(next);
        setTheme(next);
      }}
    />
  );
}
