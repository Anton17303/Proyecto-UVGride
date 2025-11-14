// src/screens/TripFormScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

import { API_URL } from "../services/api";
import { TravelStackParamList } from "../navigation/TravelStack";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput, LinkText, BackButton } from "../components";
import { useAchievements } from "../achievements/AchievementsContext"; // 👈 NUEVO

type TripFormScreenRouteProp = RouteProp<TravelStackParamList, "TripFormScreen">;
type TripFormNavigationProp = NativeStackNavigationProp<TravelStackParamList, "TripFormScreen">;

// Haversine en km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TripFormScreen() {
  const route = useRoute<TripFormScreenRouteProp>();
  const navigation = useNavigation<TripFormNavigationProp>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const { emit, ready } = useAchievements(); // 👈 NUEVO

  const { origin, latitude, longitude, destinationName } = route.params;
  const [destination, setDestination] = useState(destinationName || "");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);

  // 📍 Obtener ubicación inicial
  useEffect(() => {
    const fetchLocation = async () => {
      if (latitude != null && longitude != null) {
        setCoords({ lat: latitude, lon: longitude });
        return;
      }
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "No se puede acceder a la ubicación.");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setCoords({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch (err) {
        console.error("Error obteniendo ubicación:", err);
        Alert.alert("Error", "No se pudo obtener la ubicación.");
      }
    };
    fetchLocation();
  }, [latitude, longitude]);

  const validateScheduledAt = (dt: Date) => {
    const now = new Date();
    const min = new Date(now.getTime() + 2 * 60 * 1000);
    return dt.getTime() >= min.getTime();
  };

  const handleCreateTrip = async () => {
    const trimmedDest = destination.trim();

    if (!trimmedDest) {
      return Alert.alert("Destino requerido", "Por favor ingresa un destino válido.");
    }
    if (!user?.id) {
      return Alert.alert("Error", "Usuario no autenticado.");
    }
    if (!isScheduled && !coords) {
      return Alert.alert("Ubicación faltante", "No se pudo determinar tu ubicación.");
    }
    if (isScheduled && !validateScheduledAt(scheduledAt)) {
      return Alert.alert(
        "Fecha inválida",
        "El viaje programado debe ser al menos 2 minutos en el futuro."
      );
    }

    setLoading(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (!isScheduled) {
        const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb&text=${encodeURIComponent(
          trimmedDest
        )}`;
        const { data: geoData } = await axios.get(geoUrl);

        if (!geoData.features?.length) {
          return Alert.alert("Destino no encontrado", "No se pudo localizar el destino.");
        }

        [lng, lat] = geoData.features[0].geometry.coordinates;
      }

      const tripData: any = {
        origen: origin,
        destino: trimmedDest,
        lat_origen: coords?.lat ?? null,
        lon_origen: coords?.lon ?? null,
        lat_destino: lat,
        lon_destino: lng,
        costo_total: 10.0,
        id_usuario: user.id,
        es_programado: isScheduled,
      };

      if (isScheduled) {
        tripData.fecha_programada = scheduledAt.toISOString();
      }

      await axios.post(`${API_URL}/api/viajes/crear`, tripData);

      // ✅ MVP de logros:
      // Si es viaje NO programado, lo marcamos como "completado" al guardarlo para probar
      // first_ride y five_rides. Luego podrás mover este emit al "fin real" en TravelScreen.
      if (!isScheduled && coords && lat != null && lng != null && ready) {
        const distanceKm = haversineKm(coords.lat, coords.lon, lat, lng);
        emit("RIDE_COMPLETED", { distanceKm: Math.max(0, Number(distanceKm) || 0) });
      }

      if (isScheduled) {
        Alert.alert(
          "Viaje programado",
          `Tu viaje a "${trimmedDest}" quedó programado para ${scheduledAt.toLocaleString()}.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.dispatch(
          CommonActions.navigate({
            name: "TravelScreen",
            params: {
              latitude: coords!.lat,
              longitude: coords!.lon,
              destinationLatitude: lat!,
              destinationLongitude: lng!,
            },
          })
        );
      }
    } catch (err: any) {
      console.error("❌ Error creando viaje:", err);
      Alert.alert("Error", err.response?.data?.error || "No se pudo procesar el viaje.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <BackButton />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Origen */}
        <View style={styles.block}>
          <Text style={[styles.caption, { color: colors.text }]}>Origen</Text>
          <Text style={[styles.value, { color: colors.text }]}>{origin}</Text>
        </View>

        {/* Destino */}
        <View style={styles.block}>
          <Text style={[styles.caption, { color: colors.text }]}>Destino</Text>
          <AnimatedInput
            placeholder="Ingresa un destino"
            value={destination}
            onChangeText={setDestination}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
            editable={!loading}
          />
        </View>

        {/* Programar viaje */}
        <View style={[styles.block, styles.scheduleRow]}>
          <Text style={[styles.labelInline, { color: colors.text }]}>Programar viaje</Text>
          <Switch
            value={isScheduled}
            onValueChange={setIsScheduled}
            trackColor={{ false: "#ddd", true: colors.primary }}
            thumbColor={isScheduled ? "#fff" : "#f4f3f4"}
          />
        </View>

        {isScheduled && (
          <View style={[styles.block, styles.datetimeBox]}>
            <View style={styles.datetimeRow}>
              <TouchableOpacity
                style={[
                  styles.pickBtn,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                onPress={() => setShowPicker("date")}
                disabled={loading}
              >
                <Text style={{ color: colors.text }}>{scheduledAt.toLocaleDateString()}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pickBtn,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                onPress={() => setShowPicker("time")}
                disabled={loading}
              >
                <Text style={{ color: colors.text }}>
                  {scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <DateTimePicker
                value={scheduledAt}
                mode={showPicker}
                is24Hour
                onChange={(_, d) => {
                  setShowPicker(null);
                  if (d) setScheduledAt(d);
                }}
                minimumDate={new Date()}
              />
            )}
          </View>
        )}

        {/* Botón principal */}
        <PrimaryButton
          title={isScheduled ? "Programar viaje" : "Guardar viaje"}
          onPress={handleCreateTrip}
          loading={loading}
          color={colors.primary}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 0.90 },
  container: { flex: 1, padding: 20, gap: 20, justifyContent: "center" },
  block: { gap: 6 },
  caption: { fontSize: 14, fontWeight: "500", opacity: 0.7 },
  value: { fontSize: 16, fontWeight: "600" },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelInline: { fontSize: 16, fontWeight: "600" },
  datetimeBox: { gap: 12 },
  datetimeRow: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
});
