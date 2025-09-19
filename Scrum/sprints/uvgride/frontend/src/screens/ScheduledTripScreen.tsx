import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

import ScheduledTripCard from "../components/ScheduledTripCard";
import EmptyState from "../components/EmptyState";

type TripItem = {
  id_viaje_maestro: number;
  origen: string;
  destino: string;
  fecha_inicio: string | null;
  estado_viaje: string;
  costo_total?: number;
};

export default function ScheduledTripScreen() {
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<TripItem[]>([]);

  const fetchTrips = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/viajes/usuario/${user.id}`
      );
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

  const renderItem = ({ item }: { item: TripItem }) => (
    <ScheduledTripCard
      destino={item.destino}
      fecha={formatDateTime(item.fecha_inicio)}
      costo={item.costo_total}
      colorText={colors.text}
      backgroundColor={colors.card}
      onDelete={() => handleDelete(item.id_viaje_maestro)}
    />
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Encabezado */}
      <Text style={[styles.header, { color: colors.text }]}>
        Viajes Programados
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : trips.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No tienes viajes programados"
          subtitle="Programa uno desde el formulario de viajes."
          color={colors.primary}
          textColor={colors.text}
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(it) => String(it.id_viaje_maestro)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 12, // espacio lateral
  },
});
