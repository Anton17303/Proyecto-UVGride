// src/screens/GroupDetailScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/type';
import { getGroup, closeGroup, Grupo } from '../services/groups';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';
import { useUser } from '../context/UserContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
type Rt = RouteProp<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const rawParam = (route?.params as any)?.groupId ?? (route?.params as any)?.grupoId;
  const groupId = Number(rawParam);

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Grupo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fmtDate = useMemo(
    () => (s?: string | null) =>
      s ? new Date(s).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    []
  );

  const fetchGroup = useCallback(async () => {
    if (!Number.isInteger(groupId) || groupId <= 0) {
      setError('No se recibió un ID de grupo válido.');
      setLoading(false);
      return;
    }
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setLoading(true);
      setError(null);
      const g = await getGroup(groupId, user?.id ? { user_id: Number(user.id) } : undefined);
      if (!isMounted.current) return;
      setGroup(g);
    } catch (e: any) {
      if (!isMounted.current) return;
      console.error('getGroup error:', e?.response?.data || e?.message);
      setError(e?.response?.data?.error || 'No se pudo cargar el grupo.');
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
      isFetching.current = false;
    }
  }, [groupId, user?.id]);

  const loadAll = useCallback(async () => {
    await fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const isOwner = useMemo(
    () => (user?.id != null && group ? Number(user.id) === Number(group.conductor_id) : false),
    [user?.id, group]
  );

  const nombreConductor = useMemo(() => {
    if (!group?.conductor) return 'Conductor';
    return `${group.conductor.nombre ?? ''} ${group.conductor.apellido ?? ''}`.trim() || 'Conductor';
  }, [group]);

  const v = group?.conductor?.vehiculos?.[0];

  const cuposTotales = Number(group?.capacidad_total ?? group?.cupos_totales ?? 0);
  const cuposUsados = Number(group?.cupos_usados ?? 0);
  const cuposDisp = Number.isFinite(Number(group?.cupos_disponibles))
    ? Number(group?.cupos_disponibles)
    : Math.max(0, cuposTotales - cuposUsados);

  const members = group?.miembros ?? [];

  const handleClose = async (estado: 'cerrado' | 'cancelado' | 'finalizado') => {
    try {
      if (!group) return;
      if (!user?.id) return Alert.alert('Sesión', 'Inicia sesión.');
      await closeGroup(group.id_grupo, { conductor_id: user.id, estado });
      Alert.alert('Listo', `Grupo ${estado}`);
      await loadAll();
    } catch (e: any) {
      console.error('closeGroup error:', e?.response?.data || e?.message);
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo actualizar el grupo');
    }
  };

  // 👇 IMPORTANTE: enviar SIEMPRE rateForGroupId
  const goToDriverProfile = () => {
    if (!group) return;
    navigation.navigate('DriverProfile', {
      driverId: group.conductor_id,
      rateForGroupId: group.id_grupo,
    } as any);
  };

  const Header = () => (
    <View style={[styles.headerBox, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Detalle del grupo</Text>

      <Text style={[styles.item, { color: colors.text }]}>
        <Text style={styles.label}>Conductor: </Text>
        <Text style={[styles.link, { color: colors.primary }]} onPress={goToDriverProfile}>
          {nombreConductor}
        </Text>
      </Text>

      {v && (
        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={styles.label}>Vehículo: </Text>
          {v.marca} {v.modelo} · {v.placa}
        </Text>
      )}

      <Text style={[styles.item, { color: colors.text }]}>
        <Text style={styles.label}>Destino: </Text>
        {group?.viaje?.destino ?? group?.destino_nombre ?? '—'}
      </Text>

      <Text style={[styles.item, { color: colors.text }]}>
        <Text style={styles.label}>Estado: </Text>
        {group?.estado}
      </Text>

      <Text style={[styles.item, { color: colors.text }]}>
        <Text style={styles.label}>Cupos: </Text>
        {cuposDisp} / {cuposTotales}
      </Text>

      <Text style={[styles.item, { color: colors.text }]}>
        <Text style={styles.label}>Salida: </Text>
        {fmtDate(group?.viaje?.fecha_inicio ?? group?.fecha_salida)}
      </Text>

      {isOwner && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => handleClose('cerrado')}
            disabled={group?.estado !== 'abierto'}
            style={[
              styles.actionBtn,
              { backgroundColor: group?.estado === 'abierto' ? '#1565c0' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>Cerrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleClose('cancelado')}
            disabled={group?.estado !== 'abierto'}
            style={[
              styles.actionBtn,
              { backgroundColor: group?.estado === 'abierto' ? '#c62828' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleClose('finalizado')}
            disabled={group?.estado !== 'cerrado'}
            style={[
              styles.actionBtn,
              { backgroundColor: group?.estado === 'cerrado' ? '#2e7d32' : '#9e9e9e' },
            ]}
          >
            <Text style={styles.actionTxt}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.subTitle, { color: colors.text, marginTop: 10 }]}>Miembros</Text>
    </View>
  );

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Detalle del grupo</Text>
        <View style={[styles.headerBox, { backgroundColor: colors.card }]}>
          <Text style={styles.errTitle}>Parámetro inválido</Text>
          <Text style={{ color: colors.text }}>No se recibió un ID de grupo válido.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Detalle del grupo</Text>
        <View style={[styles.headerBox, { backgroundColor: colors.card }]}>
          <Text style={styles.errTitle}>Error</Text>
          <Text style={{ color: colors.text }}>{error}</Text>
          <TouchableOpacity onPress={loadAll} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={members}
        keyExtractor={(m: any) => String(m.id_grupo_miembro ?? `${m.id_usuario}-${m.joined_at}`)}
        ListHeaderComponent={<Header />}
        renderItem={({ item }: any) => (
          <View style={[styles.memberRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {item.usuario?.nombre ?? ''} {item.usuario?.apellido ?? ''}
            </Text>
            <Text style={{ color: colors.text, opacity: 0.8 }}>
              {item.rol} · {item.estado_solicitud}
            </Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 28 }}
        removeClippedSubviews={false}
        initialNumToRender={10}
        windowSize={6}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  subTitle: { fontSize: 16, fontWeight: '700' },
  headerBox: { borderRadius: 14, padding: 14, marginBottom: 8 },
  item: { fontSize: 14, marginBottom: 4 },
  label: { fontWeight: '700' },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionTxt: { color: '#fff', fontWeight: '700' },
  memberRow: { padding: 12, borderRadius: 12 },
  memberName: { fontWeight: '700', marginBottom: 2 },
  errTitle: { color: '#d32f2f', fontWeight: '800', marginBottom: 6, fontSize: 16 },
  retryBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
});