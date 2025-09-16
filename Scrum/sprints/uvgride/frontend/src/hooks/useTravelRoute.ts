import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import axios from "axios";

const OPENROUTESERVICE_API_KEY =
  "5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb";

export function useTravelRoute(params?: {
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}) {
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [summary, setSummary] = useState<{ durationSec: number; distanceKm: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // 📍 Pedir ubicación actual
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

  // 🚗 Dibujar ruta
  const drawRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    try {
      setLoading(true);
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

      setCoords(coords);

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
      setLoading(false);
    }
  };

  // ⚡ Setup inicial
  useEffect(() => {
    const setup = async () => {
      if (
        params?.latitude &&
        params?.longitude &&
        params?.destinationLatitude &&
        params?.destinationLongitude
      ) {
        const originData = { latitude: params.latitude, longitude: params.longitude };
        const destData = { latitude: params.destinationLatitude, longitude: params.destinationLongitude };
        setOrigin(originData);
        setDestination(destData);
        await drawRoute(originData, destData);
      } else if (!params?.latitude || !params?.longitude) {
        const location = await requestUserLocation();
        if (location) setOrigin(location);
      }
    };
    setup();
  }, []);

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    coords,
    summary,
    loading,
    drawRoute,
  };
}
