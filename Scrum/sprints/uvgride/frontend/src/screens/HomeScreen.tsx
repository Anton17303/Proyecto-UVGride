// src/screens/HomeScreen.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

import TripCard from "../components/TripCard";
import EmptyState from "../components/EmptyState";
import FloatingActionButton from "../components/FloatingActionButton";

import { useStreak } from "../hooks/useStreak";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [trips, setTrips] = useState<any[]>([]);

  const { ready, current, best } = useStreak();

  const fetchTrips = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_URL}/api/viajes/usuario/${user.id}`);
      setTrips(response.data.viajes || []);
    } catch (err) {
      console.error("❌ Error al cargar historial de viajes", err);
      Alert.alert("Error", "No se pudo cargar tu historial de viajes.");
    }
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, [user?.id]));

  const handleRepeatTrip = (trip: any) => {
    if (!trip.destino) {
      Alert.alert("Error", "El viaje no tiene un destino válido.");
      return;
    }
    navigation.navigate("Viaje" as never, {
      screen: "TripFormScreen",
      params: {
        origin: "Ubicación actual",
        latitude: null,
        longitude: null,
        destinationName: trip.destino,
      },
    } as never);
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "Sin fecha";
    const date = new Date(fecha);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Bienvenido, {user?.name || "Usuario"}
        </Text>

        {ready && (
          <View style={[styles.streakCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakTitle, { color: "#fff" }]}>Tu racha</Text>
              <Text style={[styles.streakValue, { color: "#fff" }]}>
                {current > 0
                  ? `${current} ${current === 1 ? "día" : "días"} seguidos`
                  : "Aún no tienes racha"}
              </Text>
              <Text style={[styles.streakSub, { color: "#fff" }]}>
                Mejor: {best}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.subtitle, { color: colors.primary }]}>
          Tu historial de viajes
        </Text>

        <FlatList
          data={trips}
          keyExtractor={(item) => item.id_viaje_maestro.toString()}
          renderItem={({ item }) => (
            <TripCard
              origen={item.origen}
              destino={item.destino}
              fecha={formatFecha(item.fecha_inicio)}
              onPress={() => handleRepeatTrip(item)}
              loading={false}
              color={colors.primary}
              background={colors.card}
              textColor={colors.text}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="car-outline"
              title="Aún no tienes viajes"
              subtitle={
                "Empieza creando tu primer viaje desde el mapa.\n¡Haz tu trayecto más fácil con UVGride!"
              }
              color={colors.primary}
              textColor={colors.text}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <FloatingActionButton
          icon="star-outline"
          label="Lugares Favoritos"
          backgroundColor={colors.primary}
          onPress={() => navigation.navigate("Favorite" as never)}
          style={{ position: "absolute", bottom: 30, right: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, marginTop: 16, marginBottom: 12, fontWeight: "500" },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  streakEmoji: { fontSize: 26, marginRight: 10, color: "#fff" },
  streakTitle: { fontSize: 14, fontWeight: "700", opacity: 0.95 },
  streakValue: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  streakSub: { fontSize: 12, opacity: 0.9, marginTop: 2 },
});
