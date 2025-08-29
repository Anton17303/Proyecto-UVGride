// src/screens/PassengerScreen.tsx
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
type EstadoFilter = 'todos' | 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
type CupoFilter = 'cualquiera' | 'con' | 'sin';

const ESTADO_OPTIONS: { label: string; value: EstadoFilter }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abiertos', value: 'abierto' },
  { label: 'Cerrados', value: 'cerrado' },
  { label: 'Cancelados', value: 'cancelado' },
  { label: 'Finalizados', value: 'finalizado' },
];

const CUPO_OPTIONS: { label: string; value: CupoFilter }[] = [
  { label: 'Cualquiera', value: 'cualquiera' },
  { label: 'Con cupos', value: 'con' },
  { label: 'Sin cupos', value: 'sin' },
];

export default function PassengerScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [cupoFilter, setCupoFilter] = useState<CupoFilter>('cualquiera');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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

  // ↓↓↓ join con actualización optimista ↓↓↓
  const onJoin = async (id: number) => {
    try {
      if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
      if (joiningId) return; // evita doble toque
      setJoiningId(id);

      // 1) actualización optimista local
      setGrupos((prev) =>
        prev.map((g) => {
          if (g.id_grupo !== id) return g;
          const cuposTotales = Number(g.capacidad_total ?? g.cupos_totales ?? 0);
          const usados = Number(g.cupos_usados ?? 0);
          const dispActual =
            typeof g.cupos_disponibles === 'number'
              ? g.cupos_disponibles
              : Math.max(cuposTotales - usados, 0);
          return {
            ...g,
            es_miembro: true,
            cupos_disponibles: Math.max(dispActual - 1, 0),
            cupos_usados: typeof g.cupos_usados === 'number' ? g.cupos_usados + 1 : g.cupos_usados,
          };
        })
      );

      // 2) llamada real
      await joinGroup(id, { id_usuario: Number(user.id) });

      // 3) feedback y sincronización
      Alert.alert('¡Listo!', 'Te uniste al grupo');
      fetchData();
    } catch (e: any) {
      console.error(e);
      // Revertir optimismo si falla
      setGrupos((prev) =>
        prev.map((g) => {
          if (g.id_grupo !== id) return g;
          const cuposTotales = Number(g.capacidad_total ?? g.cupos_totales ?? 0);
          const usados = Number(g.cupos_usados ?? 0);
          const dispActual =
            typeof g.cupos_disponibles === 'number'
              ? g.cupos_disponibles
              : Math.max(cuposTotales - usados, 0);
          return {
            ...g,
            es_miembro: false,
            cupos_disponibles: dispActual + 1,
            cupos_usados: typeof g.cupos_usados === 'number' ? Math.max(g.cupos_usados - 1, 0) : g.cupos_usados,
          };
        })
      );
      Alert.alert('Error', e?.response?.data?.error || 'No fue posible unirte');
    } finally {
      setJoiningId(null);
    }
  };

  const currency = useMemo(
    () => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }),
    []
  );

  const hasJoinedAny = useMemo(() => grupos.some((g) => g.es_miembro), [grupos]);

  // Helpers para cálculo de cupos
  const getCuposDisp = (g: Grupo) => {
    const cuposTotales = Number(g.capacidad_total ?? g.cupos_totales ?? 0);
    const cuposUsados = Number(g.cupos_usados ?? 0);
    return typeof g.cupos_disponibles === 'number'
      ? g.cupos_disponibles
      : Math.max(0, cuposTotales - cuposUsados);
  };

  // Lista filtrada
  const gruposFiltrados = useMemo(() => {
    return grupos.filter((g) => {
      const okEstado = estadoFilter === 'todos' ? true : g.estado === estadoFilter;
      if (!okEstado) return false;

      const disp = getCuposDisp(g);
      if (cupoFilter === 'con' && disp <= 0) return false;
      if (cupoFilter === 'sin' && disp > 0) return false;

      return true;
    });
  }, [grupos, estadoFilter, cupoFilter]);

  const EstadoBadge = ({ estado }: { estado: Grupo['estado'] }) => {
    const bg =
      estado === 'abierto' ? '#2e7d32' :
      estado === 'cerrado' ? '#616161' :
      estado === 'cancelado' ? '#b71c1c' :
      '#1565c0';
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeTxt}>{estado.toUpperCase()}</Text>
      </View>
    );
  };

  // === Filtro compact pill que rota opciones al tocar ===
  const RotatingPill = ({
    label,
    valueLabel,
    onPress,
  }: {
    label: string;
    valueLabel: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.pill}
      activeOpacity={0.85}
    >
      <Text style={styles.pillText}>
        {label}: <Text style={styles.pillValue}>{valueLabel}</Text>
      </Text>
    </TouchableOpacity>
  );

  // Ciclar opciones con un tap
  const cycleEstado = () => {
    const idx = ESTADO_OPTIONS.findIndex(o => o.value === estadoFilter);
    const next = ESTADO_OPTIONS[(idx + 1) % ESTADO_OPTIONS.length].value;
    setEstadoFilter(next);
  };
  const cycleCupo = () => {
    const idx = CUPO_OPTIONS.findIndex(o => o.value === cupoFilter);
    const next = CUPO_OPTIONS[(idx + 1) % CUPO_OPTIONS.length].value;
    setCupoFilter(next);
  };

  // UI del item
  const renderItem = ({ item }: { item: Grupo }) => {
    const v = item.conductor?.vehiculos?.[0];
    const nombreConductor = `${item.conductor?.nombre ?? ''} ${item.conductor?.apellido ?? ''}`.trim();

    const cuposTotales = Number(item.capacidad_total ?? item.cupos_totales ?? 0);
    const cuposDisp = getCuposDisp(item);

    const isOwner =
      Boolean(item.es_propietario) ||
      (user?.id != null && Number(user.id) === Number(item.conductor_id));

    const isOpen = item.estado === 'abierto';
    const isMemberHere = Boolean(item.es_miembro);

    const disabledJoin =
      isOwner ||
      !isOpen ||
      cuposDisp <= 0 ||
      (hasJoinedAny && !isMemberHere) ||
      joiningId === item.id_grupo;

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
      : joiningId === item.id_grupo
      ? 'Uniendo...'
      : 'Unirse';

    const canSeeDetail = isMemberHere || isOwner;

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
            Salida{' '}
            {new Date(item.fecha_salida).toLocaleString('es-GT', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        )}

        <View style={styles.actionsRow}>
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

          <TouchableOpacity
            onPress={() => navigation.navigate('GroupDetail', { grupoId: item.id_grupo })}
            disabled={!canSeeDetail}
            style={[
              styles.detailBtn,
              {
                borderColor: canSeeDetail ? colors.primary : '#cccccc',
                opacity: canSeeDetail ? 1 : 0.6,
              },
            ]}
          >
            <Text
              style={[
                styles.detailTxt,
                { color: canSeeDetail ? colors.primary : '#aaaaaa' },
              ]}
            >
              Ver detalle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header + toolbar compacta */}
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: colors.text }]}>Grupos</Text>

        {/* Toolbar compacta: dos pills + limpiar (todo en una fila) */}
        <View style={styles.toolbar}>
          <RotatingPill
            label="Estado"
            valueLabel={ESTADO_OPTIONS.find(o => o.value === estadoFilter)?.label ?? 'Todos'}
            onPress={cycleEstado}
          />
          <RotatingPill
            label="Cupos"
            valueLabel={CUPO_OPTIONS.find(o => o.value === cupoFilter)?.label ?? 'Cualquiera'}
            onPress={cycleCupo}
          />
          <TouchableOpacity
            onPress={() => { setEstadoFilter('todos'); setCupoFilter('cualquiera'); }}
            style={styles.clearMini}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clearMiniTxt, { color: colors.primary }]}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : gruposFiltrados.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.text }]}>
          {grupos.length === 0 ? 'No hay grupos por ahora.' : 'No hay resultados con estos filtros.'}
        </Text>
      ) : (
        <FlatList
          data={gruposFiltrados}
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
  container: { flex: 1, padding: 12 },
  topBar: { gap: 6, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800' },

  // Toolbar compacta
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d7d7d7',
    backgroundColor: '#f7f7f7',
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#333' },
  pillValue: { textDecorationLine: 'underline' },

  clearMini: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  clearMiniTxt: { fontSize: 12, fontWeight: '800' },

  noDataText: { textAlign: 'center', marginTop: 30, fontSize: 16 },

  // Cards
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  joinBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: '700' },

  detailBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  detailTxt: { fontWeight: '800' },
});