// src/screens/ScheduledTripScreen.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type TripItem = {
  id_viaje_maestro: number;
  origen: string;
  destino: string;
  fecha_inicio: string | null;
  estado_viaje: string;
  costo_total?: number;
};

export default function ScheduledTripScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<TripItem[]>([]);

  const fetchTrips = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/viajes/usuario/${user.id}`);
      const all: TripItem[] = data?.viajes ?? [];

      const now = new Date();
      const scheduled = all.filter((t) => {
        if (!t.fecha_inicio) return false;
        const start = new Date(t.fecha_inicio);
        return t.estado_viaje === "pendiente" && start.getTime() > now.getTime();
      });

      scheduled.sort((a, b) => {
        const ta = new Date(a.fecha_inicio || 0).getTime();
        const tb = new Date(b.fecha_inicio || 0).getTime();
        return ta - tb;
      });

      setTrips(scheduled);
    } catch (err) {
      console.error("❌ Error cargando viajes programados:", err);
      Alert.alert("Error", "No se pudieron cargar los viajes programados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrips();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "Sin fecha";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Eliminar viaje programado",
      "¿Deseas eliminar este viaje programado?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/viajes/${id}`);
              setTrips((prev) => prev.filter((t) => t.id_viaje_maestro !== id));
            } catch (err) {
              console.error("❌ Error eliminando viaje:", err);
              Alert.alert("Error", "No se pudo eliminar el viaje.");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (trip: TripItem) => {
    navigation.navigate("Home", {
      screen: "Viaje",
      params: {
        screen: "TripFormScreen",
        params: {
          origin: "Ubicación actual",
          latitude: null,
          longitude: null,
          destinationName: trip.destino,
        },
      },
    });
  };

  const renderItem = ({ item }: { item: TripItem }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.destino}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Programado: {formatDateTime(item.fecha_inicio)}
        </Text>
        {!!item.costo_total && (
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Estimado: Q{Number(item.costo_total).toFixed(2)}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.primary }]}
          onPress={() => handleEdit(item)}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: "#d9534f" }]}
          onPress={() => handleDelete(item.id_viaje_maestro)}
        >
          <Text style={[styles.actionText, { color: "#d9534f" }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      <Text style={[styles.header, { color: colors.text }]}>Viajes programados</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : trips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={{ color: colors.text, textAlign: "center" }}>
            No tienes viajes programados.
          </Text>
          <Text style={{ color: colors.text, marginTop: 6, textAlign: "center" }}>
            Programa uno desde el formulario de viajes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(it) => String(it.id_viaje_maestro)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* Botón estilo FavoriteScreen */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: colors.primary }]}>
          ← Volver al menú
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyBox: {
    marginTop: 30,
    marginHorizontal: 24,
  },
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: "center",
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: { fontWeight: "700", fontSize: 13 },

  // Estilo botón de volver (igual que FavoriteScreen)
  backButton: {
    marginTop: 10,
    padding: 10,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});