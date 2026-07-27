import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSetting, setSetting } from '@/db/settings';
import { safeLogger } from '@/utils/safe-logger';

export type AppTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('light');

  useEffect(() => {
    getSetting('theme')
      .then((storedTheme) => {
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setThemeState(storedTheme);
        }
      })
      .catch(() => safeLogger.error('Theme loading failed', { code: 'THEME_LOAD_FAILED' }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: async (nextTheme) => {
        setThemeState(nextTheme);
        await setSetting('theme', nextTheme);
      },
      toggleTheme: async () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(nextTheme);
        await setSetting('theme', nextTheme);
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside ThemeProvider');
  return context;
}
