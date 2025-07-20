import React from 'react';
import Navigation from './src/navigation/Navigation';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/ThemeContext';
import { lightColors, darkColors } from './constants/colors';

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

function MainApp() {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <NavigationContainer
    theme={{
        colors: {
          background: colors.background,
          text: colors.text,
          primary: colors.primary,
          card: colors.card,
          border: colors.border,
        },
      }}
    >

      <UserProvider>
        <Navigation />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </UserProvider>
    </NavigationContainer>
  );
}