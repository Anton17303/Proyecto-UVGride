import React, { useState } from "react";
import { View, StyleSheet, Text, Alert, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, MapPressEvent } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/core";
import * as Location from "expo-location";
import Ionicons from "react-native-vector-icons/Ionicons";

import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useTravelRoute } from "../hooks/useTravelRoute";
import {
  FloatingActionButton,
  ZoomControls,
  RouteInfoCard,
  LoadingModal,
} from "../components";

type TravelRouteProp = RouteProp<RootStackParamList, "Travel">;

export default function TravelScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const STATUS_OFFSET = Platform.OS === "ios" ? 52 : 24;

  // 📌 Hook que maneja toda la lógica de rutas
  const { origin, setOrigin, destination, coords, summary, loading } =
    useTravelRoute(params);

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setOrigin({ latitude, longitude });
  };

  const goToTripForm = () => {
    if (!origin) {
      Alert.alert("Por favor selecciona un punto válido en el mapa.");
      return;
    }
    navigation.navigate("TripFormScreen", {
      origin: "Origen desde el mapa",
      latitude: origin.latitude,
      longitude: origin.longitude,
    });
  };

  const goToScheduledList = () => navigation.navigate("ScheduledTripScreen");

  // 📍 Botón para centrar en la ubicación del usuario
  const centerOnUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa los permisos de ubicación para continuar.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(userRegion);
      setOrigin({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación.");
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {origin && <Marker coordinate={origin} title="Origen" />}
        {destination && (
          <Marker coordinate={destination} title="Destino" pinColor="red" />
        )}
        {coords.length > 0 && (
          <Polyline
            coordinates={coords}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Resumen de ruta */}
      {summary && (
        <RouteInfoCard
          durationSec={summary.durationSec}
          distanceKm={summary.distanceKm}
          backgroundColor={colors.card}
          borderColor={colors.border}
          textColor={colors.text}
          style={{
            position: "absolute",
            top: STATUS_OFFSET + 20,
            alignSelf: "center",
          }}
        />
      )}

      {/* Hint si no hay origen */}
      {!origin && (
        <View
          style={[
            styles.hintContainer,
            { backgroundColor: `${colors.card}DD` },
          ]}
        >
          <Text style={[styles.hintText, { color: colors.text }]}>
            Toca el mapa para elegir tu origen
          </Text>
        </View>
      )}

      {/* Botón de ubicación */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: colors.card }]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Zoom controls */}
      <ZoomControls
        onZoomIn={() =>
          setRegion((prev) => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta / 2,
            longitudeDelta: prev.longitudeDelta / 2,
          }))
        }
        onZoomOut={() =>
          setRegion((prev) => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta * 2,
            longitudeDelta: prev.longitudeDelta * 2,
          }))
        }
        buttonColor={colors.primary}
        backgroundColor={colors.card}
        style={{ position: "absolute", bottom: 40, left: 20 }}
      />

      {/* FABs */}
      <FloatingActionButton
        id="navigate"
        icon="navigate"
        label="Nuevo Viaje"
        backgroundColor={colors.primary}
        onPress={goToTripForm}
        style={{ position: "absolute", bottom: 40, right: 20 }}
      />

      <FloatingActionButton
        id="calendar"
        icon="calendar-outline"
        label="Programados"
        backgroundColor={colors.primary}
        onPress={goToScheduledList}
        style={{ position: "absolute", bottom: 110, right: 20 }}
      />

      {/* Loading */}
      <LoadingModal
        visible={loading}
        message="Recalculando ruta..."
        backgroundColor={colors.card}
        textColor={colors.text}
        spinnerColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hintContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -120 }, { translateY: -20 }],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hintText: { fontSize: 14, textAlign: "center" },
  locationBtn: {
    position: "absolute",
    bottom: 165, // ✅ justo encima del zoom
    left: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
});
