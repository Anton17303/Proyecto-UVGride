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
} from "react-native";
import axios from "axios";
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "../services/api";
import { TravelStackParamList } from "../navigation/TravelStack";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import * as Location from "expo-location";

type TripFormScreenRouteProp = RouteProp<TravelStackParamList, "TripFormScreen">;
type TripFormNavigationProp = NativeStackNavigationProp<TravelStackParamList, "TripFormScreen">;

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

    setLoading(true);

    try {
      const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb&text=${encodeURIComponent(trimmedDest)}`;
      const { data: geoData } = await axios.get(geoUrl);

      if (!geoData.features?.length) {
        Alert.alert("Destino no encontrado", "No se pudo localizar el destino ingresado.");
        return;
      }

      const [lng, lat] = geoData.features[0].geometry.coordinates;

      const tripData = {
        origen: origin,
        destino: trimmedDest,
        lat_origen: coords.lat,
        lon_origen: coords.lon,
        lat_destino: lat,
        lon_destino: lng,
        costo_total: 10.0,
        id_usuario: user.id,
      };

      const backendResponse = await axios.post(`${API_URL}/api/viajes/crear`, tripData);

      if (backendResponse.data?.viaje) {
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
      } else {
        Alert.alert("Error", "No se pudo guardar el viaje en el servidor.");
      }
    } catch (err: any) {
      console.error("❌ Error creando viaje:", err);
      Alert.alert("Error", err.response?.data?.error || "No se pudo procesar el viaje.");
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
          <Text style={styles.buttonText}>Guardar viaje</Text>
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