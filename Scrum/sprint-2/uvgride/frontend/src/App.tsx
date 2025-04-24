import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Navigation from './navigation/index';

export default function App() {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}