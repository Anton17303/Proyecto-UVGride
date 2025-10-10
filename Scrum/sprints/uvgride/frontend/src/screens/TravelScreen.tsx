import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, Alert, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, MapPressEvent, Circle } from "react-native-maps";
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

type UserPos = { lat: number; lng: number; accuracy?: number | null };

export default function TravelScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const STATUS_OFFSET = Platform.OS === "ios" ? 52 : 24;

  const { origin, setOrigin, destination, coords, summary, loading } =
    useTravelRoute(params);

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [userPos, setUserPos] = useState<UserPos | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

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

  const ensureWatcher = async () => {
    if (watcherRef.current) return watcherRef.current;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Activa los permisos de ubicación para continuar.");
      return null;
    }
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 2,
        timeInterval: 1000,
      },
      (loc) => {
        const { latitude, longitude, accuracy } = loc.coords;
        setUserPos({ lat: latitude, lng: longitude, accuracy });
      }
    );
    watcherRef.current = sub;
    return sub;
  };

  useEffect(() => {
    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, []);

  const centerOnUser = async () => {
    try {
      const sub = await ensureWatcher();
      if (!sub) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const {
        latitude,
        longitude,
        accuracy,
      } = location.coords;

      setUserPos({ lat: latitude, lng: longitude, accuracy });

      setRegion((prev) => ({
        ...prev,
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }));

      if (!origin) setOrigin({ latitude, longitude });
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
        showsCompass
      >

        {userPos && (
          <>
            <Marker coordinate={{ latitude: userPos.lat, longitude: userPos.lng }}>
              <BlueDot />
            </Marker>
            {typeof userPos.accuracy === "number" && userPos.accuracy > 0 && (
              <Circle
                center={{ latitude: userPos.lat, longitude: userPos.lng }}
                radius={userPos.accuracy}
                strokeColor="rgba(30,144,255,0.3)"
                fillColor="rgba(30,144,255,0.15)"
              />
            )}
          </>
        )}

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

      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: colors.card }]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </TouchableOpacity>

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

function BlueDot() {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#1E90FF",
        borderWidth: 2,
        borderColor: "#fff",
      }}
    />
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
    bottom: 165,
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
