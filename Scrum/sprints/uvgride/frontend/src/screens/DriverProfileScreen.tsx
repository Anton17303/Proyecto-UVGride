// src/screens/DriverProfileScreen.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Linking,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // ✅ ahora con Ionicons

import { API_URL } from "../services/api";
import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { getDriverRatingSummary, rateDriverSimple } from "../services/groups";
import { BackButton } from "../components";

type Nav = NativeStackNavigationProp<RootStackParamList, "DriverProfile">;
type RouteProps = RouteProp<RootStackParamList, "DriverProfile">;

type Vehiculo = {
  id_vehiculo: number;
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  capacidad_pasajeros: number;
};

type ConductorDTO = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo_institucional: string;
  tipo_usuario: string;
  vehiculos: Vehiculo[];
};

type ConductorResponse = { data: ConductorDTO };

export default function DriverProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const { user } = useUser();

  const driverId = useMemo(() => {
    const raw = params?.driverId as any;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [params?.driverId]);

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<ConductorDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ promedio: number; total: number } | null>(null);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const fetchDriver = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await axios.get<ConductorResponse>(`${API_URL}/api/conductores/${driverId}`);
      setDriver(res.data?.data ?? null);
    } catch (err) {
      console.error("❌ Error cargando perfil:", err);
      Alert.alert("Error", "No se pudo cargar el perfil del conductor.");
      setDriver(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId, refreshing]);

  const fetchSummary = useCallback(async () => {
    try {
      const s = await getDriverRatingSummary(Number(driverId));
      setRatingSummary({
        promedio: Number(s?.promedio ?? 0),
        total: Number(s?.total ?? 0),
      });
    } catch (e) {
      console.error("❌ Error fetch rating:", e);
      setRatingSummary(null);
    }
  }, [driverId]);

  useEffect(() => {
    fetchDriver();
    fetchSummary();
  }, [fetchDriver, fetchSummary]);

  const showRatingForm = Boolean(user?.id && driverId && Number(user.id) !== Number(driverId));

  const submitRating = async () => {
    if (!showRatingForm || !user?.id || !driverId) return;
    if (sending) return;
    try {
      setSending(true);
      await rateDriverSimple(Number(driverId), {
        pasajero_id: Number(user.id),
        puntuacion: stars,
        comentario: comment.trim() || undefined,
      });
      Alert.alert("¡Gracias!", "Tu calificación fue enviada.");
      setComment("");
      fetchSummary();
    } catch (e) {
      console.error("❌ rateDriverSimple error:", e);
      Alert.alert("Error", "No se pudo enviar la calificación.");
    } finally {
      setSending(false);
    }
  };

  const initials = driver ? `${driver.nombre[0] || ""}${driver.apellido[0] || ""}`.toUpperCase() : "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>

      {/* Back */}
      <BackButton />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Cargando perfil…</Text>
        </View>
      ) : !driver ? (
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>No se pudo cargar el perfil.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDriver} />}
        >
          {/* Card de perfil */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarTxt}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {driver.nombre} {driver.apellido}
                </Text>
                {ratingSummary ? (
                  <Text style={{ color: colors.text, marginTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text key={i}>{i < ratingSummary.promedio ? "⭐" : "☆"}</Text>
                    ))}{" "}
                    {ratingSummary.promedio.toFixed(1)} ({ratingSummary.total})
                  </Text>
                ) : (
                  <Text style={{ color: colors.text, opacity: 0.6 }}>Sin calificaciones aún</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${driver.telefono}`)}>
              <Ionicons name="call-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.info, { color: colors.text }]}>{driver.telefono}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${driver.correo_institucional}`)}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.info, { color: colors.text }]}>{driver.correo_institucional}</Text>
            </TouchableOpacity>
          </View>

          {/* Vehículos */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehículos</Text>
          {driver.vehiculos?.length ? (
            driver.vehiculos.map((v) => (
              <View key={v.id_vehiculo} style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Ionicons name="car-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.vehicleTitle, { color: colors.text }]}>
                    {v.marca} {v.modelo}
                  </Text>
                </View>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>Placa: {v.placa}</Text>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>Color: {v.color}</Text>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>
                  Capacidad: {v.capacidad_pasajeros} pasajeros
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.text, opacity: 0.7, marginTop: 8 }}>
              Este conductor no tiene vehículos registrados.
            </Text>
          )}

          {/* Rating */}
          {showRatingForm && (
            <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.rateTitle, { color: colors.text }]}>Calificar a este conductor</Text>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} style={{ marginRight: 6 }}>
                    <Ionicons
                      name={n <= stars ? "star" : "star-outline"}
                      size={26}
                      color={n <= stars ? "#FFD700" : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                placeholder="Comentario (opcional)"
                placeholderTextColor="#888"
                value={comment}
                onChangeText={setComment}
                style={[
                  styles.textArea,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                multiline
              />
              <TouchableOpacity
                onPress={submitRating}
                disabled={sending}
                style={[
                  styles.rateBtn,
                  { backgroundColor: sending ? "#9e9e9e" : colors.primary },
                ]}
              >
                <Text style={styles.rateBtnTxt}>{sending ? "Enviando…" : "Enviar calificación"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontWeight: "700", marginLeft: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTxt: { color: "#fff", fontWeight: "800", fontSize: 22 },
  name: { fontSize: 20, fontWeight: "800" },

  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  info: { fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginVertical: 10 },
  vehicleCard: { borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  vehicleTitle: { fontSize: 16, fontWeight: "700" },
  vehicleLine: { fontSize: 14, marginTop: 2 },

  rateCard: { borderRadius: 12, padding: 14, marginTop: 20 },
  rateTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  textArea: {
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  rateBtn: { marginTop: 6, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  rateBtnTxt: { color: "#fff", fontWeight: "700" },
});
