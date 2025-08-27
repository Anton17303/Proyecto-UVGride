import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
};

export default function GroupCard({
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
}: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPressConductor} activeOpacity={0.7}>
        <Text style={styles.conductor} numberOfLines={1}>
          👤 {conductorNombre}
        </Text>
      </TouchableOpacity>

      <Text style={styles.destino}>📍 {destino}</Text>

      {vehiculo ? (
        <Text style={styles.vehiculo}>
          🚗 {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
        </Text>
      ) : null}

      <Text style={styles.cupos}>
        🪑 Cupos: {cuposDisponibles}/{cuposTotales}
      </Text>

      {typeof costoEstimado === 'number' ? (
        <Text style={styles.meta}>💵 Estimado: Q{costoEstimado.toFixed(2)}</Text>
      ) : null}

      {fechaSalida ? (
        <Text style={styles.meta}>🕒 {new Date(fechaSalida).toLocaleString()}</Text>
      ) : null}

      {primaryLabel ? (
        <TouchableOpacity
          style={[styles.primaryBtn, disabledPrimary && { opacity: 0.6 }]}
          onPress={onPressPrimary}
          disabled={disabledPrimary}
        >
          <Text style={styles.primaryTxt}>{primaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  conductor: { fontWeight: '700', fontSize: 16, marginBottom: 6 },
  destino: { fontSize: 15, marginBottom: 4 },
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