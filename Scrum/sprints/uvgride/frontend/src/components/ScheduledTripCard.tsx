// src/components/ScheduledTripCard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  destino: string;
  fecha: string;
  costo?: number | null;
  colorText: string;
  backgroundColor: string;
  onDelete: () => void;
  style?: ViewStyle;
};

export default function ScheduledTripCard({
  destino,
  fecha,
  costo,
  colorText,
  backgroundColor,
  onDelete,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor, borderLeftColor: "#4CAF50" }, // borde verde fijo
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colorText }]} numberOfLines={1}>
          {destino}
        </Text>
        <Text style={[styles.subtitle, { color: colorText }]}>
          Programado: {fecha}
        </Text>

        {costo != null && (
          <Text style={[styles.subtitle, { color: colorText }]}>
            Estimado: Q{Number(costo).toFixed(2)}
          </Text>
        )}
      </View>

      {/* Botón eliminar circular */}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    marginHorizontal: 12,
    borderLeftWidth: 6, // borde lateral
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  deleteBtn: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d9534f",
    justifyContent: "center",
    alignItems: "center",
  },
});
