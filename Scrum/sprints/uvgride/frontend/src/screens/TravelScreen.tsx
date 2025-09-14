import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import MapView, { Marker, Polyline, MapPressEvent } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/core";
import axios from "axios";
import * as Location from "expo-location";

import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import {
  FloatingActionButton,
  ZoomControls,
  RouteInfoCard,
  LoadingModal,
} from "../components";

const OPENROUTESERVICE_API_KEY =
  "5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb";

type TravelRouteProp = RouteProp<RootStackParamList, "Travel">;

export default function TravelScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const STATUS_OFFSET = Platform.OS === "ios" ? 52 : 24;

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [originMarker, setOriginMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeDrawn, setRouteDrawn] = useState(false);
  const [summary, setSummary] = useState<{ durationSec: number; distanceKm: number } | null>(null);

  const requestUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa los permisos de ubicación para continuar.");
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación.");
      return null;
    }
  };

  const drawRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    try {
      setLoadingRoute(true);
      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        { coordinates: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]] },
        { headers: { Authorization: OPENROUTESERVICE_API_KEY, "Content-Type": "application/json" } }
      );

      const feature = res.data?.features?.[0];
      const coords = feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      setRouteCoords(coords);
      setRouteDrawn(true);

      const sum = feature?.properties?.summary;
      if (sum) {
        setSummary({
          durationSec: Number(sum.duration) || 0,
          distanceKm: (Number(sum.distance) || 0) / 1000,
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error("Error al obtener la ruta:", error);
      Alert.alert("Error", "No se pudo calcular la ruta");
      setSummary(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    const setup = async () => {
      if (
        params?.latitude &&
        params?.longitude &&
        params?.destinationLatitude &&
        params?.destinationLongitude &&
        !routeDrawn
      ) {
        const origin = { latitude: params.latitude, longitude: params.longitude };
        const destination = { latitude: params.destinationLatitude, longitude: params.destinationLongitude };

        setOriginMarker(origin);
        setDestinationMarker(destination);
        setRegion({ ...origin, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        await drawRoute(origin, destination);
      } else if (!params?.latitude || !params?.longitude) {
        const location = await requestUserLocation();
        if (location) {
          setOriginMarker(location);
          setRegion({ ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }
      }
    };
    setup();
  }, []);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setOriginMarker({ latitude, longitude });
  };

  const goToTripForm = () => {
    if (!originMarker) {
      Alert.alert("Por favor selecciona un punto válido en el mapa.");
      return;
    }
    navigation.navigate("TripFormScreen", {
      origin: "Origen desde el mapa",
      latitude: originMarker.latitude,
      longitude: originMarker.longitude,
    });
  };

  const goToScheduledList = () => navigation.navigate("ScheduledTripScreen");

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {originMarker && <Marker coordinate={originMarker} title="Origen" />}
        {destinationMarker && <Marker coordinate={destinationMarker} title="Destino" pinColor="red" />}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor={colors.primary} strokeWidth={4} />
        )}
        <Marker
          coordinate={{ latitude: 14.604361, longitude: -90.490041 }}
          title="UVG"
          description="Universidad del Valle de Guatemala"
          pinColor="green"
        />
      </MapView>

      {/* Resumen de ruta */}
      {summary && (
        <RouteInfoCard
          durationSec={summary.durationSec}
          distanceKm={summary.distanceKm}
          backgroundColor={colors.card}
          borderColor={colors.border}
          textColor={colors.text}
          style={{ position: "absolute", top: STATUS_OFFSET + 20, alignSelf: "center" }}
        />
      )}

      {/* Zoom abajo a la izquierda */}
      <ZoomControls
        onZoomIn={() =>
          setRegion(prev => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta / 2,
            longitudeDelta: prev.longitudeDelta / 2,
          }))
        }
        onZoomOut={() =>
          setRegion(prev => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta * 2,
            longitudeDelta: prev.longitudeDelta * 2,
          }))
        }
        buttonColor={`${colors.primary}CC`}
        style={{ position: "absolute", bottom: 50, left: 25 }}
      />

      {/* FAB principal */}
      <FloatingActionButton
        icon="navigate"
        backgroundColor={colors.primary}
        onPress={goToTripForm}
        style={{ position: "absolute", bottom: 40, right: 20 }}
      />

      {/* FAB secundario */}
      <FloatingActionButton
        icon="calendar-outline"
        backgroundColor={colors.primary}
        onPress={goToScheduledList}
        style={{ position: "absolute", bottom: 110, right: 25, width: 48, height: 48, borderRadius: 24 }}
      />

      {/* Loading modal */}
      <LoadingModal
        visible={loadingRoute}
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
});
