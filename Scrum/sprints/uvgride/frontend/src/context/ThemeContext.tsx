import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(Appearance.getColorScheme() || 'light');

  const toggleTheme = () => {
    setTheme((prev: ThemeMode) => prev === 'light' ? 'dark' : 'light');
  };

  // Cambios en el sistema (opcional)
  useEffect(() => {
    const subscription = Appearance.addChangeListener((preferences: Appearance.AppearancePreferences) => {
      setTheme(preferences.colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};