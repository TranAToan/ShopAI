import React, { createContext, ReactNode, useContext, useState } from 'react';
import { COLORS } from '@constants/theme';

const LIGHT_COLORS = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textLight: COLORS.textLight,
  primary: COLORS.primary,
};

const DARK_COLORS = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F5F5F5',
  textLight: '#B0B7BD',
  primary: COLORS.primary,
};

type ThemeContextValue = {
  isDark: boolean;
  colors: typeof LIGHT_COLORS;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [isDark, setIsDark] = useState(false);
  const value = {
    isDark,
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    toggleTheme: () => setIsDark(previous => !previous),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
