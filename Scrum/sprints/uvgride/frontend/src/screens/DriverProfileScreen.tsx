// src/screens/DriverProfileScreen.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_URL } from '../services/api';
import { RootStackParamList } from '../navigation/type';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';
import { useUser } from '../context/UserContext';

// ✅ nuevos servicios para rating global
import {
  getDriverRatingSummary,
  rateDriverSimple,
} from '../services/groups';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DriverProfile'>;
type RouteProps = RouteProp<RootStackParamList, 'DriverProfile'>;

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
  // si tu endpoint trae cache global, lo mostramos:
  calif_conductor_avg?: number;
  calif_conductor_count?: number;
};

type ConductorResponse = { data: ConductorDTO };

export default function DriverProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const { user } = useUser();

  // ID del conductor (obligatorio)
  const driverId = useMemo(() => {
    const raw = params?.driverId as any;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [params?.driverId]);

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<ConductorDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Resumen global de rating
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<{ promedio: number; total: number } | null>(null);

  // Formulario de rating global
  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [sending, setSending] = useState(false);

  /* =========================
     Fetch perfil
     ========================= */
  const fetchDriver = useCallback(async () => {
    if (!driverId) {
      Alert.alert('Datos incompletos', 'No se recibió el ID del conductor.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    try {
      if (!refreshing) setLoading(true);

      const res = await axios.get<ConductorResponse>(`${API_URL}/api/conductores/${driverId}`);
      const data = res.data?.data ?? null;
      setDriver(
        data
          ? { ...data, vehiculos: Array.isArray(data.vehiculos) ? data.vehiculos : [] }
          : null
      );
    } catch (err: any) {
      console.error('❌ Error cargando perfil de conductor:', err);
      if (err?.response?.status === 404) {
        Alert.alert('No encontrado', 'No se encontró al conductor o no tiene vehículos.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo cargar el perfil del conductor.');
      }
      setDriver(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId, navigation, refreshing]);

  /* =========================
     Fetch resumen global
     ========================= */
  const fetchSummary = useCallback(async () => {
    if (!driverId) {
      setRatingSummary(null);
      setRatingError(null);
      return;
    }
    try {
      setRatingLoading(true);
      setRatingError(null);
      const s = await getDriverRatingSummary(driverId);
      const avg = Number(s?.promedio ?? 0);
      const cnt = Number(s?.total ?? 0);
      setRatingSummary({ promedio: avg, total: cnt });
    } catch (e: any) {
      console.error('getDriverRatingSummary error:', e?.response?.data || e?.message);
      setRatingSummary(null);
      setRatingError('No se pudo cargar el resumen de calificaciones.');
    } finally {
      setRatingLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchDriver(), fetchSummary()]).finally(() => setRefreshing(false));
  };

  /* =========================
     Mostrar formulario?
     Regla simple (global):
     - usuario logueado
     - no es el mismo conductor
     ========================= */
  const showRatingForm = Boolean(user?.id && driverId && Number(user.id) !== Number(driverId));

  /* =========================
     Submit calificación global
     ========================= */
  const submitRating = async () => {
    if (!showRatingForm || !user?.id || !driverId) return;
    if (sending) return; // evitar doble tap
    if (stars < 1 || stars > 5) {
      Alert.alert('Calificación', 'Elige entre 1 y 5 estrellas.');
      return;
    }
    try {
      setSending(true);
      await rateDriverSimple(Number(driverId), {
        pasajero_id: Number(user.id),
        puntuacion: stars,
        comentario: comment.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada.');
      setComment('');
      // Actualiza el resumen global
      await fetchSummary();
    } catch (e: any) {
      console.error('rateDriverSimple error:', e?.response?.data || e?.message);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo enviar la calificación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Volver</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Cargando perfil...</Text>
        </View>
      ) : !driver ? (
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>No se pudo cargar el perfil.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Perfil */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.name, { color: colors.text }]}>
              {driver.nombre} {driver.apellido}
            </Text>
            <Text style={[styles.info, { color: colors.text }]}>📞 {driver.telefono}</Text>
            <Text style={[styles.info, { color: colors.text }]} numberOfLines={1}>
              ✉️ {driver.correo_institucional}
            </Text>
            <Text style={[styles.badge, { borderColor: colors.primary, color: colors.primary }]}>
              {driver.tipo_usuario}
            </Text>
          </View>

          {/* Resumen de calificaciones (GLOBAL) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Calificación del conductor</Text>

            {ratingLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.text }}>Cargando resumen…</Text>
              </View>
            )}

            {!ratingLoading && ratingError && (
              <Text style={{ color: '#d32f2f' }}>{ratingError}</Text>
            )}

            {!ratingLoading && ratingSummary && (
              <Text style={{ color: colors.text }}>
                Promedio global:{' '}
                <Text style={{ fontWeight: '800' }}>
                  {ratingSummary.promedio.toFixed(1)} ⭐
                </Text>{' '}
                ({ratingSummary.total} opiniones)
              </Text>
            )}

            {!ratingLoading && !ratingSummary && !ratingError && driver.calif_conductor_count === undefined && (
              <Text style={{ color: colors.text, opacity: 0.7 }}>Sin calificaciones todavía.</Text>
            )}
          </View>

          {/* Vehículos */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehículos</Text>
          {driver.vehiculos?.length ? (
            driver.vehiculos.map((v) => (
              <View key={v.id_vehiculo} style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.vehicleTitle, { color: colors.text }]}>
                  {v.marca} {v.modelo}
                </Text>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>Placa: {v.placa}</Text>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>Color: {v.color}</Text>
                <Text style={[styles.vehicleLine, { color: colors.text }]}>
                  Capacidad: {v.capacidad_pasajeros} pasajeros
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.text, opacity: 0.7 }}>
              Este conductor no tiene vehículos registrados.
            </Text>
          )}

          {/* Formulario de calificación GLOBAL */}
          {showRatingForm && (
            <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.rateTitle, { color: colors.text }]}>
                Calificar a este conductor
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} style={{ marginRight: 6 }}>
                    <Text style={{ fontSize: 22 }}>{n <= stars ? '⭐' : '☆'}</Text>
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
                  { backgroundColor: colors.card, color: colors.text, borderColor: '#ddd' },
                ]}
                multiline
              />
              <TouchableOpacity
                onPress={submitRating}
                disabled={sending}
                style={[
                  styles.rateBtn,
                  { backgroundColor: sending ? '#9e9e9e' : '#2e7d32' },
                ]}
              >
                <Text style={styles.rateBtnTxt}>{sending ? 'Enviando…' : 'Enviar calificación'}</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, opacity: 0.6, marginTop: 6, fontSize: 12 }}>
                * La calificación es global para este conductor (no por viaje).
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontWeight: '700', textDecorationLine: 'underline' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  info: { fontSize: 14, marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginVertical: 10, paddingHorizontal: 2 },
  vehicleCard: { borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  vehicleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  vehicleLine: { fontSize: 14, marginTop: 2 },

  // rating UI
  rateCard: { borderRadius: 12, padding: 14, marginTop: 16 },
  rateTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  textArea: { borderRadius: 8, padding: 10, minHeight: 70, borderWidth: StyleSheet.hairlineWidth },
  rateBtn: { marginTop: 8, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rateBtnTxt: { color: '#fff', fontWeight: '700' },
});