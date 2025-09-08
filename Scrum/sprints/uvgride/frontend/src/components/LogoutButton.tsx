import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type Props = { onPress: () => void };

export default function LogoutButton({ onPress }: Props) {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: "#C93838" }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="log-out-outline" size={20} color="#fff" />
      <Text style={styles.text}>Cerrar sesión</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 60, // más estrecho para resaltar esquinas
    marginTop: "auto",
    marginBottom: 20,
    gap: 8,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
