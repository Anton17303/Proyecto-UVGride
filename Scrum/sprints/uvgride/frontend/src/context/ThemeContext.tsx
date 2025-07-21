import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useUser } from './UserContext';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => Promise<void>;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUserFromBackend } = useUser();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Prioridad: 1. Preferencia del usuario | 2. Sistema | 3. Default light
    return user?.preferencia_tema || Appearance.getColorScheme() || 'light';
  });

  // Sincronizar con el backend cuando cambia el usuario
  useEffect(() => {
    if (user?.preferencia_tema) {
      setTheme(user.preferencia_tema);
    }
  }, [user?.preferencia_tema]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    try {
      if (user?.id) {
        // Actualizar en el backend
        await axios.patch(`${API_URL}/api/users/${user.id}`, {
          preferencia_tema: newTheme,
        });
        
        // Actualizar en el contexto de usuario
        setUserFromBackend({ 
          ...user, 
          preferencia_tema: newTheme 
        });
      }
    } catch (error) {
      console.error('Error al actualizar el tema:', error);
      // Revertir en caso de error
      setTheme(theme);
    }
  };

  // Cambios del sistema (opcional)
  useEffect(() => {
    const subscription = Appearance.addChangeListener((appearance: { colorScheme: ThemeMode | null }) => {
      const { colorScheme } = appearance;
      if (!user?.preferencia_tema) { 
        setTheme(colorScheme || 'light');
      }
    });
    return () => subscription.remove();
  }, [user?.preferencia_tema]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDarkMode: theme === 'dark' 
    }}>
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