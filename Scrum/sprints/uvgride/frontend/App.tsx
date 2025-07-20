import React from 'react';
import Navigation from './src/navigation/Navigation';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './src/context/UserContext';

export default function App() {
  return (
    <NavigationContainer>
      <UserProvider>
        <Navigation />
        <StatusBar style="light" />
      </UserProvider>
    </NavigationContainer>
  );
}