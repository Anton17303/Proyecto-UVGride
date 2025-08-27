import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { listGroups, joinGroup, Grupo } from '../services/groups';
import { RootStackParamList } from '../navigation/type';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';
import { useUser } from '../context/UserContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriverScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listGroups({ estado: 'abierto' });
      setGrupos(data);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const onJoin = async (id: number) => {
    try {
      if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
      await joinGroup(id, { id_usuario: user.id });
      Alert.alert('¡Listo!', 'Te uniste al grupo');
      fetchData(); // refresca al instante
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No fue posible unirte');
    }
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const v = item.conductor?.vehiculos?.[0];
    const nombreConductor = `${item.conductor?.nombre ?? ''} ${item.conductor?.apellido ?? ''}`.trim();
    const cuposTotales = item.capacidad_total ?? item.cupos_totales ?? 0;
    const cuposDisp = item.cupos_disponibles ?? Math.max(0, cuposTotales - (item as any).cupos_usados ?? 0);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DriverProfile', { driverId: item.conductor_id })}
        >
          <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>
            {nombreConductor || 'Conductor'}
          </Text>
        </TouchableOpacity>

        {v && (
          <Text style={{ color: colors.text, marginBottom: 2 }}>
            Vehículo: {v.marca} {v.modelo} · {v.placa}
          </Text>
        )}

        <Text style={{ color: colors.text, marginBottom: 2 }}>
          Destino: {item.viaje?.destino ?? item.destino_nombre ?? '—'}
        </Text>

        <Text style={{ color: colors.text, marginBottom: 8 }}>
          Cupos: {cuposDisp} / {cuposTotales}
        </Text>

        <TouchableOpacity
          onPress={() => onJoin(item.id_grupo)}
          style={[styles.joinBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.joinBtnText}>Unirse</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Grupos disponibles</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : grupos.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.text }]}>No hay grupos abiertos por ahora.</Text>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => String(item.id_grupo)}
          renderItem={renderItem}
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
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  noDataText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
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
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  joinBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: '700' },
});