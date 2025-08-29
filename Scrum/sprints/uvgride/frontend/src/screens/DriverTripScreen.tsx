// src/screens/DriverTripScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/type';
import { listGroups, closeGroup, Grupo } from '../services/groups';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';
import { useUser } from '../context/UserContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriverTripScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const { user } = useUser(); // user.id = conductor_id

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [joinedOther, setJoinedOther] = useState(false); // unido como pasajero a un grupo ajeno
  const [closingId, setClosingId] = useState<number | null>(null); // evita doble tap en acciones

  const fmtDate = useMemo(
    () => (s?: string | null) =>
      s
        ? new Date(s).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Por definir',
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Traemos TODOS los grupos con user_id para flags es_miembro/es_propietario
      const all = await listGroups(user?.id ? { user_id: Number(user.id) } : undefined);

      // Solo mis grupos (donde soy conductor) para gestionarlos aquí
      const mine = user?.id ? all.filter((g) => g.conductor_id === Number(user.id)) : [];
      setGrupos(mine);

      // ¿Estoy unido en algún grupo ajeno como pasajero?
      const iJoinedOther =
        user?.id
          ? all.some((g) => g.es_miembro === true && g.es_propietario !== true)
          : false;
      setJoinedOther(iJoinedOther);
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

  const doClose = async (g: Grupo, estado: 'cerrado' | 'cancelado' | 'finalizado') => {
    try {
      if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
      if (closingId) return; // evita taps repetidos mientras hay una acción en curso
      setClosingId(g.id_grupo);

      await closeGroup(g.id_grupo, { conductor_id: user.id, estado });
      Alert.alert('OK', `Grupo ${estado}`);
      fetchData();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo actualizar el grupo');
    } finally {
      setClosingId(null);
    }
  };

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

    const isAbierto = item.estado === 'abierto';
    const canCancel = item.estado === 'abierto' || item.estado === 'cerrado';
    const canFinalize = item.estado === 'cerrado';

    const isBusy = closingId === item.id_grupo;

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

        <Text style={{ color: colors.text, marginBottom: 2 }}>
          Cupos: {cuposDisp} / {cuposTotales}
        </Text>

        <Text style={{ color: colors.text, marginBottom: 8 }}>
          Salida: {fmtDate(item.viaje?.fecha_inicio ?? item.fecha_salida)}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupDetail', { grupoId: item.id_grupo })} // ✅ param correcto
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.actionTxt}>Ver detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => doClose(item, 'cerrado')}
            disabled={!isAbierto || isBusy}
            style={[
              styles.actionBtn,
              { backgroundColor: isAbierto && !isBusy ? '#1565c0' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>{isBusy ? '...' : 'Cerrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => doClose(item, 'cancelado')}
            disabled={!canCancel || isBusy}
            style={[
              styles.actionBtn,
              { backgroundColor: canCancel && !isBusy ? '#c62828' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>{isBusy ? '...' : 'Cancelar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => doClose(item, 'finalizado')}
            disabled={!canFinalize || isBusy}
            style={[
              styles.actionBtn,
              { backgroundColor: canFinalize && !isBusy ? '#2e7d32' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>{isBusy ? '...' : 'Finalizar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const esConductor = (user?.tipo_usuario || '').toLowerCase() === 'conductor';
  const createDisabled = joinedOther || !esConductor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Mis grupos</Text>
        <TouchableOpacity
          onPress={() => {
            if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
            if (createDisabled) {
              return Alert.alert(
                'No disponible',
                !esConductor
                  ? 'Solo los conductores pueden crear grupos.'
                  : 'No puedes crear un grupo porque actualmente estás unido a otro como pasajero.'
              );
            }
            navigation.navigate('GroupCreate');
          }}
          style={[
            styles.createBtn,
            { backgroundColor: createDisabled ? '#9e9e9e' : colors.primary },
          ]}
          disabled={createDisabled}
        >
          <Text style={styles.createBtnText}>
            {createDisabled ? (esConductor ? 'Unido en otro' : 'No disponible') : 'Crear grupo'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : grupos.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.text }]}>
          Aún no tienes grupos creados.
        </Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  createBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '700' },
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
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionTxt: { color: '#fff', fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
});