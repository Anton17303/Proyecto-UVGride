// src/screens/DriverProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_URL } from '../services/api';
import { RootStackParamList } from '../navigation/type';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

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
};

type ConductorResponse = { data: ConductorDTO };

export default function DriverProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const driverId = params?.driverId;

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<ConductorDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
      setDriver(data ? { ...data, vehiculos: Array.isArray(data.vehiculos) ? data.vehiculos : [] } : null);
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

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDriver();
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
});