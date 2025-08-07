import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
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

type TripFormScreenRouteProp = RouteProp<TravelStackParamList, "TripFormScreen">;
type TripFormNavigationProp = NativeStackNavigationProp<
  TravelStackParamList,
  "TripFormScreen"
>;

export default function TripFormScreen() {
  const route = useRoute<TripFormScreenRouteProp>();
  const navigation = useNavigation<TripFormNavigationProp>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const { origin, latitude, longitude, destinationName } = route.params;
  const [destination, setDestination] = useState(destinationName || "");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Programación
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);

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
    const min = new Date(now.getTime() + 2 * 60 * 1000); // >= 2 minutos
    return dt.getTime() >= min.getTime();
  };

  const handlePick = (_: any, selected?: Date) => {
    setShowPicker(null);
    if (selected) setScheduledAt(selected);
  };

  const handleCreateTrip = async () => {
    const trimmedDest = destination.trim();

    if (!trimmedDest) {
      Alert.alert("Destino requerido", "Por favor ingresa un destino válido.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    if (!coords) {
      Alert.alert("Ubicación faltante", "No se pudo determinar tu ubicación.");
      return;
    }
    if (isScheduled && !validateScheduledAt(scheduledAt)) {
      Alert.alert(
        "Fecha inválida",
        "El viaje programado debe ser al menos 2 minutos en el futuro."
      );
      return;
    }

    setLoading(true);
    try {
      // Geocodificar destino
      const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb&text=${encodeURIComponent(
        trimmedDest
      )}`;
      const { data: geoData } = await axios.get(geoUrl);

      if (!geoData.features?.length) {
        Alert.alert("Destino no encontrado", "No se pudo localizar el destino.");
        return;
      }

      const [lng, lat] = geoData.features[0].geometry.coordinates;

      // Payload que espera tu backend
      const tripData: any = {
        origen: origin,
        destino: trimmedDest,
        lat_origen: coords.lat,
        lon_origen: coords.lon,
        lat_destino: lat,
        lon_destino: lng,
        costo_total: 10.0,
        id_usuario: user.id,          // <- el controller lo mapea a usuario_id
        es_programado: !!isScheduled, // <- flag esperado en tu modelo
      };

      if (isScheduled) {
        // tu modelo no tiene fecha_programada, usamos fecha_inicio como programación
        tripData.fecha_inicio = scheduledAt.toISOString();
      }

      const { data } = await axios.post(`${API_URL}/api/viajes/crear`, tripData);

      const created = data?.viaje;
      if (!created) {
        Alert.alert("Error", "No se pudo guardar el viaje en el servidor.");
        return;
      }

      if (isScheduled) {
        Alert.alert(
          "Viaje programado",
          `Tu viaje a "${trimmedDest}" quedó programado para ${scheduledAt.toLocaleString()}.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // viaje inmediato → ir al mapa
        navigation.dispatch(
          CommonActions.navigate({
            name: "TravelScreen",
            params: {
              latitude: coords.lat,
              longitude: coords.lon,
              destinationLatitude: lat,
              destinationLongitude: lng,
            },
          })
        );
      }
    } catch (err: any) {
      console.error("❌ Error creando viaje:", err);
      Alert.alert(
        "Error",
        err.response?.data?.error || "No se pudo procesar el viaje."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={[styles.label, { color: colors.text }]}>Origen</Text>
      <Text style={[styles.value, { color: colors.text }]}>{origin}</Text>

      {coords && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Coordenadas</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            Lat: {coords.lat.toFixed(6)} / Lon: {coords.lon.toFixed(6)}
          </Text>
        </>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Destino</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
        placeholder="Ingresa un destino"
        value={destination}
        onChangeText={setDestination}
        autoCapitalize="sentences"
        placeholderTextColor={colors.placeholder}
        editable={!loading}
      />

      {/* Programar viaje */}
      <View style={styles.scheduleRow}>
        <Text style={[styles.labelInline, { color: colors.text }]}>
          Programar viaje
        </Text>
        <Switch
          value={isScheduled}
          onValueChange={setIsScheduled}
          trackColor={{ false: "#767577", true: colors.primary }}
          thumbColor={isScheduled ? "#fff" : "#f4f3f4"}
        />
      </View>

      {isScheduled && (
        <View style={styles.datetimeBox}>
          <Text style={[styles.labelSmall, { color: colors.text }]}>
            Fecha y hora del viaje
          </Text>

          <View style={styles.datetimeRow}>
            <TouchableOpacity
              style={[
                styles.pickBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setShowPicker("date")}
              disabled={loading}
            >
              <Text style={{ color: colors.text }}>
                {scheduledAt.toLocaleDateString()}
              </Text>
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
                {scheduledAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          loading && { opacity: 0.6 },
        ]}
        onPress={handleCreateTrip}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isScheduled ? "Programar viaje" : "Guardar viaje"}
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 20 },
  value: { fontSize: 16, marginTop: 5 },
  input: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  scheduleRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelInline: { fontSize: 16, fontWeight: "600" },
  datetimeBox: { marginTop: 10 },
  labelSmall: { fontSize: 14, marginBottom: 8 },
  datetimeRow: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  button: {
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});