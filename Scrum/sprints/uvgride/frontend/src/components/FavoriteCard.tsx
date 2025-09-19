// src/components/FavoriteCard.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  nombre: string;
  descripcion?: string;
  color?: string; // 🎨 color personalizado para borde
  textColor?: string;
  backgroundColor?: string;
  onPress: () => void;
  onDelete: () => void;
  style?: ViewStyle;
};

export default function FavoriteCard({
  nombre,
  descripcion,
  color = "#4CAF50",
  textColor = "#000",
  backgroundColor = "#fff",
  onPress,
  onDelete,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor, borderLeftColor: color },
        style,
      ]}
    >
      {/* Zona clickeable */}
      <TouchableOpacity
        onPress={onPress}
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar ${nombre}`}
      >
        <View>
          <Text style={[styles.name, { color: textColor }]}>{nombre}</Text>
          {descripcion && (
            <Text style={[styles.description, { color: textColor }]}>
              {descripcion}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Botón eliminar circular rojo */}
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${nombre}`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
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
    borderLeftWidth: 6, // 👈 color personalizado aquí
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  deleteButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d9534f", // 🔴 rojo
    justifyContent: "center",
    alignItems: "center",
  },
});
