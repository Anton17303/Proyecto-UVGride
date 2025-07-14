import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "../services/api";
import { TravelStackParamList } from "../navigation/TravelStack"; // Asegúrate que este tipo exista

type TripFormScreenRouteParams = {
  origin: string;
  latitude: number;
  longitude: number;
};

type TripFormNavigationProp = NativeStackNavigationProp<
  TravelStackParamList,
  "TripFormScreen"
>;

export default function TripFormScreen() {
  const route = useRoute();
  const navigation = useNavigation<TripFormNavigationProp>();

  const { origin, latitude, longitude } =
    (route.params as TripFormScreenRouteParams) || {};

  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateTrip = async () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Por favor ingresa un destino válido");
      return;
    }

    setLoading(true);

    try {
      const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb&text=${encodeURIComponent(destination)}`;
      const { data: geoData } = await axios.get(geoUrl);

      if (geoData.features && geoData.features.length > 0) {
        const [lng, lat] = geoData.features[0].geometry.coordinates;

        const backendResponse = await axios.post(
          `${API_URL}/api/viajes/crear`,
          {
            origen: origin,
            destino: destination,
            lat_origen: latitude,
            lon_origen: longitude,
            lat_destino: lat,
            lon_destino: lng,
            costo_total: 10.0,
          }
        );

        if (backendResponse.data && backendResponse.data.viaje) {
          Alert.alert("¡Éxito!", "¡Viaje creado correctamente!");

          navigation.navigate("TravelScreen", {
            latitude,
            longitude,
            destinationLatitude: lat,
            destinationLongitude: lng,
          });
        } else {
          Alert.alert("Error", "No se pudo guardar el viaje en el servidor");
        }
      } else {
        Alert.alert("Error", "No se pudo encontrar el destino");
      }
    } catch (err: any) {
      console.error("Error al crear el viaje:", err);
      Alert.alert(
        "Error",
        err.response?.data?.error || "No se pudo procesar el viaje"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Origen</Text>
      <Text style={styles.value}>{origin}</Text>

      <Text style={styles.label}>Coordenadas</Text>
      <Text style={styles.value}>
        Lat: {latitude.toFixed(6)} / Lon: {longitude.toFixed(6)}
      </Text>

      <Text style={styles.label}>Destino</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa un destino"
        value={destination}
        onChangeText={setDestination}
        autoCapitalize="sentences"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleCreateTrip}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar viaje</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const PRIMARY_COLOR = "#4CAF50";

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 20, color: "#333" },
  value: { fontSize: 16, color: "#555", marginTop: 5 },
  input: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});