import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import BottomTabs from './src/navigation/BottomTabs'; // Asumiendo que tus tabs están aquí

export default function App() {
  return (
    <NavigationContainer>
      <BottomTabs />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}