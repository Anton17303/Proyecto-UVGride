// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import RootStack from './src/navigation/RootStack';

import { UserProvider, useUser } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { lightColors, darkColors } from './src/constants/colors';

import { AchievementsProvider, useAchievements } from './src/achievements/AchievementsContext';
import AchievementUnlockModal from './src/components/AchievementUnlockModal';

function AchievementGateway() {
  const { state, consumeNextPending } = useAchievements();
  const [current, setCurrent] = useState<string | undefined>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
    <NavigationContainer theme={navTheme}>
      {/* OJO: ya NO ponemos otro UserProvider aquí */}
      <RootStack />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

// Envuelve children con AchievementsProvider usando una clave por usuario
function WithAchievements({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const userKey = user?.id ? String(user.id) : 'anon';
  return <AchievementsProvider userKey={userKey}>{children}</AchievementsProvider>;
}

export default function App() {
  return (
    <UserProvider>
      <WithAchievements>
        <ThemeProvider>
          <MainApp />
          {/* El modal vive aquí para tener acceso a Theme y Achievements */}
          <AchievementGateway />
        </ThemeProvider>
      </WithAchievements>
    </UserProvider>
  );
}
