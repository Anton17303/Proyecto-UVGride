import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TravelStack from "./TravelStack";
import DriverTripScreen from "../screens/DriverTripScreen";
import DriverScreen from "../screens/DriverScreen";
import { CommonActions } from "@react-navigation/native";
import { useUser } from "../context/UserContext";

export type BottomTabParamList = {
  Inicio: undefined;
  Viaje: undefined;
  Perfil: undefined;
  Conductores?: undefined; // para pasajeros
  MisViajes?: undefined;   // para conductores
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabs() {
  const { user } = useUser();

  const esConductor = user?.tipo_usuario?.toLowerCase() === "conductor";
  const esPasajero = user?.tipo_usuario?.toLowerCase() === "pasajero";

  return (
    <Tab.Navigator
      key={user?.id}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "green",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Inicio") iconName = "home-outline";
          else if (route.name === "Viaje") iconName = "airplane-outline";
          else if (route.name === "Perfil") iconName = "person-outline";
          else if (route.name === "Conductores") iconName = "car-outline";
          else if (route.name === "MisViajes") iconName = "list-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />

      <Tab.Screen
        name="Viaje"
        component={TravelStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.navigate({
                name: "Viaje",
                params: { screen: "TravelScreen" },
              })
            );
          },
        })}
      />

      {/* ✅ Solo para pasajeros */}
      {esPasajero && (
        <Tab.Screen name="Conductores" component={DriverScreen} />
      )}

      {/* ✅ Solo para conductores */}
      {esConductor && (
        <Tab.Screen name="MisViajes" component={DriverTripScreen} />
      )}

      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}