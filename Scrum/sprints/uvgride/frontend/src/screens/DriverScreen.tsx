// src/screens/DriverScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';

import { RootStackParamList } from '../navigation/type';
import { API_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DriverProfile'>;

interface Vehiculo {
  id_vehiculo: number;
  marca: string;
  modelo: string;
  placa: string;
  color?: string;
  capacidad_pasajeros?: number;
}

interface Conductor {
  id_usuario: number;
  nombre: string;
  apellido: string;
  telefono: string;
  vehiculos: Vehiculo[];
}

export default function DriverScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conductores, setConductores] = useState<Conductor[]>([]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/conductores`);
      const payload = Array.isArray(res.data) ? res.data : res.data?.data;
      setConductores(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('❌ Error al cargar conductores:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Cargando conductores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conductores.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>No hay conductores registrados con vehículos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <FlatList
        data={conductores}
        keyExtractor={(item) => String(item.id_usuario)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('DriverProfile', { driverId: item.id_usuario })}
            activeOpacity={0.8}
          >
            <Text style={[styles.name, { color: colors.text }]}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={[styles.phone, { color: colors.text }]}>📞 {item.telefono}</Text>

            {item.vehiculos?.map((v) => (
              <Text key={v.id_vehiculo} style={[styles.vehicle, { color: colors.text }]}>
                🚗 {v.marca} {v.modelo} ({v.placa})
              </Text>
            ))}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: '700' },
  phone: { fontSize: 14, marginVertical: 4, opacity: 0.8 },
  vehicle: { fontSize: 14, marginTop: 2 },
});