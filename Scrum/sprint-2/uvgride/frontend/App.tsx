import React from 'react';
import Navigation from './src/navigation/Navigation';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <NavigationContainer>
      <Navigation />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}