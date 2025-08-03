import React from 'react';
import RootStack from './src/navigation/RootStack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { lightColors, darkColors } from './src/constants/colors';

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

function MainApp() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      text: colors.text,
      primary: colors.primary,
      card: colors.card,
      border: colors.border,
      notification: colors.notification,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <UserProvider>
        <RootStack />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </UserProvider>
    </NavigationContainer>
  );
}