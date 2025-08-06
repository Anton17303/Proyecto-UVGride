import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const [trips, setTrips] = useState([]);
  const [loadingTripId, setLoadingTripId] = useState<number | null>(null);

  const fetchTrips = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_URL}/api/viajes/usuario/${user.id}`);
      setTrips(response.data.viajes || []);
    } catch (err) {
      console.error('❌ Error al cargar historial de viajes', err);
      Alert.alert('Error', 'No se pudo cargar tu historial de viajes.');
    }
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, [user?.id]));

  const handleRepeatTrip = (trip: any) => {
    if (!trip.destino) {
      Alert.alert('Error', 'El viaje no tiene un destino válido.');
      return;
    }

    // ✅ Navegación corregida a pantalla anidada
    navigation.navigate('Viaje', {
      screen: 'TripFormScreen',
      params: {
        origin: 'Ubicación actual',
        latitude: null,
        longitude: null,
        destinationName: trip.destino,
      },
    });
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Bienvenido de nuevo: {user?.name || 'Usuario'}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimos viajes</Text>

        <FlatList
          data={trips}
          keyExtractor={(item) => item.id_viaje_maestro.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleRepeatTrip(item)}
              style={[styles.tripItem, { backgroundColor: colors.card }]}
              disabled={loadingTripId === item.id_viaje_maestro}
            >
              <Text style={[styles.tripText, { color: colors.text }]}>
                {item.origen} → {item.destino}
              </Text>
              <Text style={[styles.tripDate, { color: colors.text }]}>
                {formatFecha(item.fecha_inicio)}
              </Text>
              {loadingTripId === item.id_viaje_maestro && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 5 }} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ marginTop: 10, color: colors.text }}>
              No tienes viajes aún.
            </Text>
          }
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Favorite')}
        >
          <Text style={styles.favoriteText}>Ir a Lugares Favoritos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 1 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  tripItem: { padding: 12, borderRadius: 8, marginBottom: 10 },
  tripText: { fontSize: 16, fontWeight: '500' },
  tripDate: { fontSize: 12 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 30,
  },
  favoriteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});