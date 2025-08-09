// src/screens/DriverTripScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

import { useUser } from '../context/UserContext';
import { API_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

type Vehiculo = {
  id_vehiculo: number;
  marca: string;
  modelo: string;
  placa: string;
  color: string;
  capacidad_pasajeros: number;
};

export default function DriverTripScreen() {
  const { user } = useUser();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const fetchVehiculos = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (!refreshing) setLoading(true);
      const res = await axios.get(`${API_URL}/api/vehiculos/usuario/${user.id}`);
      setVehiculos(res.data?.vehiculos ?? []);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, refreshing]);

  // 🔁 Se ejecuta cada vez que la pantalla vuelve a tener foco
  useFocusEffect(
    useCallback(() => {
      fetchVehiculos();
    }, [fetchVehiculos])
  );

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchVehiculos();
  };

  const renderVehiculo = ({ item }: { item: Vehiculo }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.primary }]}>
        {item.marca} {item.modelo}
      </Text>
      <Text style={{ color: colors.text }}>Placa: {item.placa}</Text>
      <Text style={{ color: colors.text }}>Color: {item.color}</Text>
      <Text style={{ color: colors.text }}>
        Capacidad: {item.capacidad_pasajeros} pasajero(s)
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Mis Vehículos</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : vehiculos.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.text }]}>
          No tienes vehículos registrados.
        </Text>
      ) : (
        <FlatList
          data={vehiculos}
          keyExtractor={(item) => String(item.id_vehiculo)}
          renderItem={renderVehiculo}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});