// App.tsx (versión corta y correcta)
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import RootStack from './src/navigation/RootStack';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { lightColors, darkColors } from './src/constants/colors';

import { AchievementsProvider, useAchievements } from './src/achievements/AchievementsContext';
import AchievementUnlockModal from './src/components/AchievementUnlockModal';

function AchievementGateway() {
  const { state, consumeNextPending } = useAchievements();
  const [current, setCurrent] = useState<string | undefined>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 👇 Log de depuración (borra luego)
    // console.log('PENDING QUEUE:', state.pendingQueue);
    if (!visible && state.pendingQueue.length > 0) {
      const id = consumeNextPending();
      if (id) {
        setCurrent(id);
        setVisible(true);
      }
    }
  }, [state.pendingQueue, visible, consumeNextPending]);

  return (
    <AchievementUnlockModal
      visible={visible}
      achievementId={current}
      onClose={() => {
        setVisible(false);
        setCurrent(undefined);
      }}
    />
  );
}

function MainApp() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: { ...(isDark ? DarkTheme.colors : DefaultTheme.colors), ...colors },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <UserProvider>
        <RootStack />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </UserProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AchievementsProvider>
      <ThemeProvider>
        <MainApp />
        <AchievementGateway />
      </ThemeProvider>
    </AchievementsProvider>
  );
}
