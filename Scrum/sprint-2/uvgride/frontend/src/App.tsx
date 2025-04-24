import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Navigation from './navigation/index.tsx';

export default function App() {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}