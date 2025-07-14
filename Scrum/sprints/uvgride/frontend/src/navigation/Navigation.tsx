import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './type';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabs from './BottomTabs';
import TravelScreen from '../screens/TravelScreen';
import TripFormScreen from '../screens/TripFormScreen';
import FavoriteScreen from '../screens/FavoriteScreen'

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={BottomTabs} />
      <Stack.Screen name="Travel" component={TravelScreen} />
      <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
      <Stack.Screen name="FavoriteScreen" component={FavoriteScreen}/>
    
    </Stack.Navigator>
  );
}
