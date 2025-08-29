import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

type Props = {
  destino: string;
  cuposDisponibles: number;
  cuposTotales: number;
  costoEstimado?: number | null;
  fechaSalida?: string | null;
  conductorNombre: string;
  vehiculo?: { marca: string; modelo: string; placa: string } | null;
  onPressConductor?: () => void;
  onPressPrimary?: () => void; // Unirse / Cerrar
  primaryLabel?: string;
  disabledPrimary?: boolean;
  /** opcional: promedio 0..5 */
  rating?: number;
  /** opcional: slot para botones/acciones extra (p.ej. cerrar/cancelar) */
  rightActions?: React.ReactNode;
  testID?: string;
};

function fmtCurrencyGTQ(n: number) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(n);
}

function fmtDateGT(s: string) {
  const d = new Date(s);
  return d.toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const GroupCard = memo(function GroupCard({
  destino,
  cuposDisponibles,
  cuposTotales,
  costoEstimado,
  fechaSalida,
  conductorNombre,
  vehiculo,
  onPressConductor,
  onPressPrimary,
  primaryLabel,
  disabledPrimary,
  rating,
  rightActions,
  testID,
}: Props) {
  const costoTxt = useMemo(() => {
    if (typeof costoEstimado === 'number' && Number.isFinite(costoEstimado)) {
      return fmtCurrencyGTQ(costoEstimado);
    }
    return null;
  }, [costoEstimado]);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPressConductor} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Ver perfil del conductor">
          <Text style={styles.conductor} numberOfLines={1}>👤 {conductorNombre}</Text>
        </TouchableOpacity>
        {rightActions}
      </View>

      <Text style={styles.destino} numberOfLines={2}>📍 {destino}</Text>

      {typeof rating === 'number' && (
        <Text style={styles.rating} accessibilityLabel={`Calificación ${rating} de 5`}>
          ⭐ {rating.toFixed(1)} / 5
        </Text>
      )}

      {vehiculo ? (
        <Text style={styles.vehiculo} numberOfLines={1}>
          🚗 {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
        </Text>
      ) : null}

      <Text style={styles.cupos}>
        🪑 Cupos: {cuposDisponibles}/{cuposTotales}
      </Text>

      {costoTxt ? <Text style={styles.meta}>💵 {costoTxt}</Text> : null}
      {fechaSalida ? <Text style={styles.meta}>🕒 {fmtDateGT(fechaSalida)}</Text> : null}

      {primaryLabel ? (
        <TouchableOpacity
          style={[styles.primaryBtn, disabledPrimary && { opacity: 0.6 }]}
          onPress={onPressPrimary}
          disabled={disabledPrimary}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabledPrimary }}
        >
          <Text style={styles.primaryTxt}>{primaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  conductor: { fontWeight: '700', fontSize: 16 },
  destino: { fontSize: 15, marginTop: 6, marginBottom: 4 },
  rating: { fontSize: 14, color: '#444', marginBottom: 4 },
  vehiculo: { fontSize: 14, opacity: 0.85, marginBottom: 4 },
  cupos: { fontSize: 14, marginBottom: 4 },
  meta: { fontSize: 13, opacity: 0.8, marginBottom: 2 },
  primaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700' },
});

export default GroupCard;