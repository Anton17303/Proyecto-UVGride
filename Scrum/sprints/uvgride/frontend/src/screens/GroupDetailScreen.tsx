// src/screens/GroupDetailScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/type';
import { getGroup, joinGroup, closeGroup, Grupo } from '../services/groups';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';
import { useUser } from '../context/UserContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupDetails'>;

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

export default function GroupDetailScreen() {
  const route = useRoute<any>(); // { params: { grupoId } }
  const navigation = useNavigation<Nav>();
  const { user } = useUser();

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const grupoId: number = Number(route.params?.grupoId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupo, setGrupo] = useState<Grupo | null>(null);

  const currency = useMemo(
    () => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }),
    []
  );

  const fmtDate = useMemo(
    () => (s?: string | null) => s
      ? new Date(s).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Por definir',
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const g = await getGroup(grupoId);
      setGrupo(g);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo cargar el grupo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [grupoId, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const g = await getGroup(grupoId);
      setGrupo(g);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo actualizar');
    } finally {
      setRefreshing(false);
    }
  }, [grupoId]);

  const onJoin = async () => {
    if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
    if (!grupo) return;
    try {
      await joinGroup(grupo.id_grupo, { id_usuario: user.id });
      Alert.alert('¡Listo!', 'Te uniste al grupo');
      onRefresh();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.error || 'No fue posible unirte');
    }
  };

  const doClose = async (estado: 'cerrado' | 'cancelado' | 'finalizado') => {
    if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
    if (!grupo) return;

    Alert.alert(
      estado === 'cerrado' ? 'Cerrar grupo' : estado === 'cancelado' ? 'Cancelar grupo' : 'Finalizar grupo',
      `¿Seguro que deseas marcar como ${estado} este grupo?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeGroup(grupo.id_grupo, { conductor_id: user.id, estado });
              Alert.alert('OK', `Grupo ${estado}`);
              onRefresh();
            } catch (e: any) {
              console.error(e);
              Alert.alert('Error', e?.response?.data?.error || 'No se pudo actualizar el grupo');
            }
          },
        },
      ]
    );
  };

  const computed = useMemo(() => {
    const cuposTotales = Number(grupo?.capacidad_total ?? grupo?.cupos_totales ?? 0);
    const cuposUsados = Number(grupo?.cupos_usados ?? 0);
    const cuposDisp = Number.isFinite(Number(grupo?.cupos_disponibles))
      ? Number(grupo?.cupos_disponibles)
      : Math.max(0, cuposTotales - cuposUsados);

    const isOwner = user?.id != null && Number(user.id) === Number(grupo?.conductor_id);
    const isOpen = (grupo?.estado as any) === 'abierto';
    const canJoin = !isOwner && isOpen && cuposDisp > 0;

    return { cuposTotales, cuposUsados, cuposDisp, isOwner, isOpen, canJoin };
  }, [grupo, user?.id]);

  if (loading || !grupo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const v = grupo.conductor?.vehiculos?.[0];
  const nombreConductor = `${grupo.conductor?.nombre ?? ''} ${grupo.conductor?.apellido ?? ''}`.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Detalle del grupo</Text>
          <EstadoBadge estado={grupo.estado} />
        </View>

        {/* Conductor */}
        <TouchableOpacity
          onPress={() => navigation.navigate('DriverProfile', { driverId: grupo.conductor_id })}
          activeOpacity={0.8}
        >
          <Text style={[styles.driver, { color: colors.primary }]} numberOfLines={1}>
            👤 {nombreConductor || 'Conductor'}
          </Text>
        </TouchableOpacity>

        {/* Vehículo */}
        {v && (
          <Text style={{ color: colors.text, marginBottom: 6 }}>
            🚗 {v.marca} {v.modelo} · {v.placa} · {v.color}
          </Text>
        )}

        {/* Destino / Fecha */}
        <Text style={{ color: colors.text, marginBottom: 4 }}>
          📍 Destino: {grupo.viaje?.destino ?? grupo.destino_nombre ?? '—'}
        </Text>
        <Text style={{ color: colors.text, marginBottom: 4 }}>
          🕒 Salida: {fmtDate(grupo.viaje?.fecha_inicio ?? grupo.fecha_salida)}
        </Text>

        {/* Cupos / Costo */}
        <Text style={{ color: colors.text, marginBottom: 4 }}>
          🪑 Cupos: {computed.cuposDisp} / {computed.cuposTotales}
        </Text>
        {grupo.costo_estimado != null && (
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            💵 Estimado: {currency.format(Number(grupo.costo_estimado))}
          </Text>
        )}

        {/* Notas (si las mandas desde backend en el futuro) */}
        {/* {grupo.notas ? (
          <Text style={{ color: colors.text, marginBottom: 8 }}>📝 {grupo.notas}</Text>
        ) : null} */}

        {/* Acciones */}
        <View style={{ height: 12 }} />

        {!computed.isOwner ? (
          <TouchableOpacity
            onPress={onJoin}
            disabled={!computed.canJoin}
            style={[
              styles.primaryBtn,
              { backgroundColor: computed.canJoin ? colors.primary : '#9e9e9e' },
            ]}
          >
            <Text style={styles.primaryTxt}>
              {computed.isOpen ? (computed.cuposDisp > 0 ? 'Unirse' : 'Sin cupos') : 'No disponible'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => doClose('cerrado')}
              disabled={!computed.isOpen}
              style={[
                styles.actionBtn,
                { backgroundColor: computed.isOpen ? '#1565c0' : '#9e9e9e' },
              ]}
            >
              <Text style={styles.actionTxt}>Cerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => doClose('cancelado')}
              disabled={!computed.isOpen}
              style={[
                styles.actionBtn,
                { backgroundColor: computed.isOpen ? '#c62828' : '#9e9e9e' },
              ]}
            >
              <Text style={styles.actionTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => doClose('finalizado')}
              style={[styles.actionBtn, { backgroundColor: '#2e7d32' }]}
            >
              <Text style={styles.actionTxt}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sección miembros (si más adelante quieres mostrar lista) */}
        {/* 
        <View style={{ marginTop: 18 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Miembros</Text>
          {grupo.miembros?.map(m => (
            <Text key={m.id_grupo_miembro} style={{ color: colors.text }}>
              - {m.usuario?.nombre} {m.usuario?.apellido} ({m.rol})
            </Text>
          ))}
        </View>
        */}

        {/* Sección calificaciones (activar si lo necesitas) */}
        {/*
        <RatingsSection grupoId={grupo.id_grupo} conductorId={grupo.conductor_id} />
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  driver: { fontSize: 18, fontWeight: '700', marginBottom: 8 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  primaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryTxt: { color: '#fff', fontWeight: '800' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  actionTxt: { color: '#fff', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 6 },
});