// src/screens/HomeScreen.tsx
import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  RefreshControl,
  Animated,
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

import StreakCard from "../components/StreakCard";
import { useStreak } from "../hooks/useStreak";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [trips, setTrips] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Racha
  const { ready, current, best, refresh, touchToday } = useStreak();

  // 🔹 Animaciones
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const streakScale = useRef(new Animated.Value(0.95)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_URL}/api/viajes/usuario/${user.id}`);
      setTrips(response.data.viajes || []);
    } catch (err) {
      console.error("❌ Error al cargar historial de viajes", err);
      Alert.alert("Error", "No se pudo cargar tu historial de viajes.");
    }
  }, [user?.id]);

  // Al enfocar la pantalla: refrescar viajes, sincronizar racha y marcar día (si aplica)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await fetchTrips();
        await refresh();
        await touchToday({ emitAchievement: true });
      })();
    }, [fetchTrips, refresh, touchToday])
  );

  // Animación de entrada del header en cada focus
  useFocusEffect(
    useCallback(() => {
      // reset
      headerOpacity.setValue(0);
      headerTranslateY.setValue(-10);
      streakScale.setValue(0.95);

      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(streakScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 7,
        }),
      ]).start();
    }, [headerOpacity, headerTranslateY, streakScale])
  );

  // Animación suave tipo “latido” para el FAB
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [fabScale]);

  const onPullRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchTrips(), refresh(), touchToday({ emitAchievement: true })]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrips, refresh, touchToday]);

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
    // Si quieres forzar "es-GT": date.toLocaleString("es-GT", { ... })
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header animado: título + racha + subtítulo */}
        <Animated.View
          style={[
            styles.headerBlock,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Bienvenido, {user?.name || "Usuario"}
          </Text>

          {ready && (
            <Animated.View style={{ transform: [{ scale: streakScale }] }}>
              <StreakCard current={current} best={best} color={colors.primary} mode="outline" />
            </Animated.View>
          )}

          <Text style={[styles.subtitle, { color: colors.primary }]}>
            Tu historial de viajes
          </Text>
        </Animated.View>

        {/* Lista de viajes */}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onPullRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {/* FAB animado */}
        <Animated.View
          style={[
            styles.fabContainer,
            {
              transform: [{ scale: fabScale }],
            },
          ]}
        >
          <FloatingActionButton
            icon="star-outline"
            label="Lugares Favoritos"
            backgroundColor={colors.primary}
            onPress={() => navigation.navigate("Favorite" as never)}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  headerBlock: {
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, marginTop: 10, marginBottom: 8, fontWeight: "500" },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
});
