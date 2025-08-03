import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TripFormScreen from '../screens/TripFormScreen';
import TravelScreen from '../screens/TravelScreen';

export type TravelStackParamList = {
  TravelScreen: {
    latitude: number;
    longitude: number;
    destinationLatitude: number;
    destinationLongitude: number;
  };
  TripFormScreen: {
    origin: string;
    latitude: number;
    longitude: number;
  };
};

const Stack = createNativeStackNavigator<TravelStackParamList>();

export default function TravelStack() {
  return (
    <Stack.Navigator
    initialRouteName="TravelScreen"
    screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TravelScreen" component={TravelScreen} />
      <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
    </Stack.Navigator>
  );
}