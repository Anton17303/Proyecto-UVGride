// src/hooks/useTravelRoute.ts
import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import { useStreak } from "./useStreak"; // ✅ misma carpeta

const OPENROUTESERVICE_API_KEY =
  "5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb";

type LatLng = { latitude: number; longitude: number };
type Summary = { durationSec: number; distanceKm: number };

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

function isSamePoint(a: LatLng, b: LatLng, tolMeters = 8) {
  return haversineMeters(a, b) <= tolMeters;
}

export function useTravelRoute(params?: {
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [coords, setCoords] = useState<LatLng[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ reemplazo de registerCreation
  const { touchToday } = useStreak();

  // control de llamadas
  const firstRouteLoggedRef = useRef(false);
  const lastODRef = useRef<{ o: LatLng; d: LatLng } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const requestUserLocation = async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa los permisos de ubicación para continuar.");
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación.");
      return null;
    }
  };

  /**
   * Dibuja la ruta entre o y d.
   * opts.skipStreak => no marcar racha (útil para recálculos automáticos)
   * opts.force      => fuerza la llamada aunque o/d sean iguales al último par
   */
  const drawRoute = async (
    o: LatLng,
    d: LatLng,
    opts?: { skipStreak?: boolean; force?: boolean }
  ) => {
    try {
      // evita llamadas redundantes cuando no hay cambios materiales en o/d
      if (!opts?.force && lastODRef.current?.o && lastODRef.current?.d) {
        if (isSamePoint(o, lastODRef.current.o) && isSamePoint(d, lastODRef.current.d)) {
          return;
        }
      }
      lastODRef.current = { o, d };

      // cancela petición anterior si sigue viva
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        { coordinates: [[o.longitude, o.latitude], [d.longitude, d.latitude]] },
        {
          headers: {
            Authorization: OPENROUTESERVICE_API_KEY,
            "Content-Type": "application/json",
          },
          signal: abortRef.current.signal,
        }
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

      // ✅ Marca racha SOLO una vez por sesión/uso de hook y no en recálculos
      //    emitAchievement:false para no duplicar APP_OPENED (ya lo manejas en Home)
      if (!opts?.skipStreak && !firstRouteLoggedRef.current) {
        await touchToday({ emitAchievement: false });
        firstRouteLoggedRef.current = true;
      }
    } catch (error: any) {
      if (axios.isCancel?.(error) || error?.name === "CanceledError") {
        // petición cancelada: no mostrar alerta ni limpiar estados
        return;
      }
      console.error("Error al obtener la ruta:", error);
      Alert.alert("Error", "No se pudo calcular la ruta");
      setSummary(null);
      setCoords([]);
    } finally {
      setLoading(false);
    }
  };

  // Setup inicial con params o con ubicación del usuario
  useEffect(() => {
    const setup = async () => {
      if (
        params?.latitude &&
        params?.longitude &&
        params?.destinationLatitude &&
        params?.destinationLongitude
      ) {
        const o = { latitude: params.latitude, longitude: params.longitude };
        const d = {
          latitude: params.destinationLatitude,
          longitude: params.destinationLongitude,
        };
        setOrigin(o);
        setDestination(d);
        await drawRoute(o, d, { skipStreak: false, force: true });
        return;
      }

      if (!params?.latitude || !params?.longitude) {
        const loc = await requestUserLocation();
        if (loc) setOrigin(loc);
      }
    };
    setup();

    return () => {
      // cancelar cualquier petición en vuelo al desmontar
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redibuja automáticamente cuando cambia origin/destination de forma “externa”
  useEffect(() => {
    if (origin && destination) {
      drawRoute(origin, destination, { skipStreak: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    coords,
    summary,
    loading,
    drawRoute, // por si necesitas invocarlo manualmente
  };
}
