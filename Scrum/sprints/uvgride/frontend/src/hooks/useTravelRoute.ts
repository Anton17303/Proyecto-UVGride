// src/hooks/useTravelRoute.ts
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import { useStreak } from "../hooks/useStreak";

const OPENROUTESERVICE_API_KEY =
  "5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb";

type LatLng = { latitude: number; longitude: number };

export function useTravelRoute(params?: {
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [coords, setCoords] = useState<LatLng[]>([]);
  const [summary, setSummary] = useState<{ durationSec: number; distanceKm: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const { registerCreation } = useStreak();

  const requestUserLocation = async (): Promise<LatLng | null> => {
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

  const drawRoute = async (o: LatLng, d: LatLng) => {
    try {
      setLoading(true);

      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        { coordinates: [[o.longitude, o.latitude], [d.longitude, d.latitude]] },
        { headers: { Authorization: OPENROUTESERVICE_API_KEY, "Content-Type": "application/json" } }
      );

      const feature = res.data?.features?.[0];
      if (!feature?.geometry?.coordinates?.length) {
        throw new Error("Sin geometría de ruta");
      }

      const poly: LatLng[] = feature.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
      );
      setCoords(poly);

      const sum = feature?.properties?.summary;
      if (sum) {
        setSummary({
          durationSec: Number(sum.duration) || 0,
          distanceKm: (Number(sum.distance) || 0) / 1000,
        });
      } else {
        setSummary(null);
      }

      await registerCreation();
    } catch (error) {
      console.error("Error al obtener la ruta:", error);
      Alert.alert("Error", "No se pudo calcular la ruta");
      setSummary(null);
      setCoords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setup = async () => {
      if (
        params?.latitude &&
        params?.longitude &&
        params?.destinationLatitude &&
        params?.destinationLongitude
      ) {
        const o = { latitude: params.latitude, longitude: params.longitude };
        const d = { latitude: params.destinationLatitude, longitude: params.destinationLongitude };
        setOrigin(o);
        setDestination(d);
        await drawRoute(o, d);
        return;
      }

      if (!params?.latitude || !params?.longitude) {
        const loc = await requestUserLocation();
        if (loc) setOrigin(loc);
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
