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
import GroupDetailScreen from '../screens/GroupDetailScreen'; // 👈 NUEVO
import { useUser } from '../context/UserContext';
import { RootStackParamList } from './type';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { user } = useUser();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      key={user ? 'app' : 'auth'}
      initialRouteName={user ? 'Home' : 'Login'}
    >
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Home" component={BottomTabs} />
          <Stack.Screen name="Favorite" component={FavoriteScreen} />
          <Stack.Screen name="AddFavorite" component={AddFavoriteScreen} />
          <Stack.Screen name="Travel" component={TravelScreen} />
          <Stack.Screen name="TripFormScreen" component={TripFormScreen} />
          <Stack.Screen name="VehicleForm" component={VehicleFormScreen} />
          <Stack.Screen name="ScheduledTripScreen" component={ScheduledTripScreen} />
          <Stack.Screen name="GroupCreate" component={GroupCreateScreen} />
          <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
          {/* 👇 Detalle del grupo con header visible */}
          <Stack.Screen
            name="GroupDetail"
            component={GroupDetailScreen}
            options={{ headerShown: true, title: 'Detalle del grupo' }}
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