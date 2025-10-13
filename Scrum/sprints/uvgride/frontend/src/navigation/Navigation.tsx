import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './type';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabs from './BottomTabs';
import TravelScreen from '../screens/TravelScreen';
import TripFormScreen from '../screens/TripFormScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import AddFavoriteScreen from '../screens/AddFavoriteScreen';
import ScheduledTripScreen from '../screens/ScheduledTripScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import PaymentScreen from '../screens/PaymentScreen';

// 👇 NUEVOS imports
import GroupCreateScreen from '../screens/GroupCreateScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* App */}
      <Stack.Screen name="Home" component={BottomTabs} />

      {/* Viajes */}
      <Stack.Screen name="Travel" component={TravelScreen} />
      <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
      <Stack.Screen name="ScheduledTripScreen" component={ScheduledTripScreen} />

      {/* Favoritos */}
      <Stack.Screen name="Favorite" component={FavoriteScreen} />
      <Stack.Screen name="AddFavorite" component={AddFavoriteScreen} />

      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* Vehículos */}
      <Stack.Screen name="VehicleForm" component={VehicleFormScreen} />

      {/* Grupos */}
      <Stack.Screen name="GroupCreate" component={GroupCreateScreen} />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ headerShown: true, title: 'Detalle del grupo' }}
      />

      {/* Perfil de conductor */}
      <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
      {/* Pagos */}
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}