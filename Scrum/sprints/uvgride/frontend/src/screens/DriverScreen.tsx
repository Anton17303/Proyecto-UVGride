import React, { useCallback, useMemo, useState } from 'react';
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

export default function PassengerScreen() {
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
      // ✅ Mostrar TODOS los grupos; mandamos user_id para recibir es_miembro/es_propietario
      const data = await listGroups(user?.id ? { user_id: Number(user.id) } : undefined);
      setGrupos(data);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
      fetchData(); // refresca flags es_miembro/es_propietario
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No fue posible unirte');
    }
  };

  const currency = useMemo(
    () => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }),
    []
  );

  // 🚫 Si ya estoy en algún grupo, bloqueo el resto (pero dejo activo el botón del grupo donde ya estoy)
  const hasJoinedAny = useMemo(
    () => grupos.some((g) => g.es_miembro),
    [grupos]
  );

  const EstadoBadge = ({ estado }: { estado: Grupo['estado'] }) => {
    const bg =
      estado === 'abierto' ? '#2e7d32' :
      estado === 'cerrado' ? '#616161' :
      estado === 'cancelado' ? '#b71c1c' :
      '#1565c0'; // finalizado u otros
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeTxt}>{estado.toUpperCase()}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const v = item.conductor?.vehiculos?.[0];
    const nombreConductor = `${item.conductor?.nombre ?? ''} ${item.conductor?.apellido ?? ''}`.trim();

    const cuposTotales = Number(item.capacidad_total ?? item.cupos_totales ?? 0);
    const cuposUsados = Number(item.cupos_usados ?? 0);
    const cuposDisp = Number.isFinite(Number(item.cupos_disponibles))
      ? Number(item.cupos_disponibles)
      : Math.max(0, cuposTotales - cuposUsados);

    const isOwner = Boolean(item.es_propietario) || (user?.id != null && Number(user.id) === Number(item.conductor_id));
    const isOpen = item.estado === 'abierto';
    const isMemberHere = Boolean(item.es_miembro);

    // Reglas de deshabilitado:
    // - No hay cupos
    // - Grupo no está abierto
    // - Es tu propio grupo
    // - Ya estás unido en otro grupo distinto (hasJoinedAny && !isMemberHere)
    const disabledJoin =
      isOwner ||
      !isOpen ||
      cuposDisp <= 0 ||
      (hasJoinedAny && !isMemberHere);

    const joinLabel = isOwner
      ? 'Tu grupo'
      : isMemberHere
      ? 'Ya unido'
      : !isOpen
      ? 'No disponible'
      : cuposDisp <= 0
      ? 'Sin cupos'
      : hasJoinedAny
      ? 'Unido en otro'
      : 'Unirse';

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('DriverProfile', { driverId: item.conductor_id })}
            style={{ flexShrink: 1 }}
          >
            <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>
              {nombreConductor || 'Conductor'}
            </Text>
          </TouchableOpacity>
          <EstadoBadge estado={item.estado} />
        </View>

        {v && (
          <Text style={{ color: colors.text, marginBottom: 2 }}>
            Vehículo: {v.marca} {v.modelo} · {v.placa}
          </Text>
        )}

        <Text style={{ color: colors.text, marginBottom: 2 }}>
          Destino: {item.viaje?.destino ?? item.destino_nombre ?? '—'}
        </Text>

        <Text style={{ color: colors.text, marginBottom: 4 }}>
          Cupos: {cuposDisp} / {cuposTotales}
        </Text>

        {item.costo_estimado != null && (
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            Estimado: {currency.format(Number(item.costo_estimado))}
          </Text>
        )}

        {item.fecha_salida && (
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            Salida:{' '}
            {new Date(item.fecha_salida).toLocaleString('es-GT', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => onJoin(item.id_grupo)}
          style={[
            styles.joinBtn,
            { backgroundColor: disabledJoin ? '#9e9e9e' : colors.primary },
          ]}
          disabled={disabledJoin}
        >
          <Text style={styles.joinBtnText}>{joinLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Todos los grupos</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : grupos.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.text }]}>
          No hay grupos por ahora.
        </Text>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => String(item.id_grupo)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, marginRight: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  joinBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  joinBtnText: { color: '#fff', fontWeight: '700' },
});