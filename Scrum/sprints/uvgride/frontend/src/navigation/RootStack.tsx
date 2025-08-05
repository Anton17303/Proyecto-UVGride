import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import FavoriteScreen from '../screens/FavoriteScreen';
import AddFavoriteScreen from '../screens/AddFavoriteScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TravelScreen from '../screens/TravelScreen';
import TripFormScreen from '../screens/TripFormScreen';
import { useUser } from '../context/UserContext';

// Define el tipo de rutas del stack
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Favorite: undefined;
  AddFavorite: undefined;
  Travel: {
    origin: string;
    latitude: number;
    longitude: number;
    destination: string;
    destinationLatitude: number;
    destinationLongitude: number;
  };
  TripFormScreen: {
    origin: string;
    latitude: number;
    longitude: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user } = useUser();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* 👇 Esto fuerza que BottomTabs se re-renderice cuando cambia el usuario */}
          <Stack.Screen
            name="Home"
            component={BottomTabs}
            key={user?.id} // 👈 esto es importante
          />
          <Stack.Screen name="Favorite" component={FavoriteScreen} />
          <Stack.Screen name="AddFavorite" component={AddFavoriteScreen} />
          <Stack.Screen name="Travel" component={TravelScreen} />
          <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}