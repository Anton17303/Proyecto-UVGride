import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  origen: string;
  destino: string;
  fecha: string;
  onPress: () => void;
  loading?: boolean;
  color: string;
  background: string;
  textColor: string;
};

export default function TripCard({ origen, destino, fecha, onPress, loading, color, background, textColor }: Props) {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: background }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.route, { color: textColor }]} numberOfLines={1}>
            {origen} → {destino}
          </Text>
          <Text style={[styles.date, { color: textColor }]}>{fecha}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={color} />
      </View>
      {loading && <ActivityIndicator size="small" color={color} style={{ marginTop: 5 }} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  route: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  date: { fontSize: 13, opacity: 0.7 },
});
