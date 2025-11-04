// src/navigation/RootStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';
import FavoriteScreen from '../screens/FavoriteScreen';
import AddFavoriteScreen from '../screens/AddFavoriteScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import TravelScreen from '../screens/TravelScreen';
import TripFormScreen from '../screens/TripFormScreen';
import ScheduledTripScreen from '../screens/ScheduledTripScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import GroupCreateScreen from '../screens/GroupCreateScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from './type';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user } = useUser();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }} // 🔥 quita headers globales
      key={user ? 'app' : 'auth'}
      initialRouteName={user ? 'Home' : 'Login'}
    >
      {user ? (
        <Stack.Group>
          {/* Tabs principales */}
          <Stack.Screen name="Home" component={BottomTabs} />

          {/* Pantallas de la app */}
          <Stack.Screen name="Favorite" component={FavoriteScreen} />
          <Stack.Screen name="AddFavorite" component={AddFavoriteScreen} />
          <Stack.Screen name="Travel" component={TravelScreen} />
          <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
          <Stack.Screen name="VehicleForm" component={VehicleFormScreen} />
          <Stack.Screen name="ScheduledTripScreen" component={ScheduledTripScreen} />
          <Stack.Screen name="GroupCreate" component={GroupCreateScreen} />
          <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />

          {/* Detalle del grupo con header oculto */}
          <Stack.Screen
            name="GroupDetail"
            component={GroupDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
