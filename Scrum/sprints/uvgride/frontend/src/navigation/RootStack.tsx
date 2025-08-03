import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import FavoriteScreen from '../screens/FavoriteScreen';
import AddFavoriteScreen from '../screens/AddFavoriteScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useUser } from '../context/UserContext';

export type RootStackParamList = {
  Tabs: undefined;
  FavoriteScreen: undefined;
  AddFavoriteScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user } = useUser();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={BottomTabs} />
          <Stack.Screen name="FavoriteScreen" component={FavoriteScreen} />
          <Stack.Screen name="AddFavoriteScreen" component={AddFavoriteScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}