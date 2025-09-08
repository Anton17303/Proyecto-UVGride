import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type Props = {
  user: { name: string; email: string };
};

export default function ProfileHeader({ user }: Props) {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: colors.primary }]}>
        <Image
          source={require("../assets/default-profile.jpg")}
          style={[styles.avatar, { borderColor: "#fff" }]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,       // se ve fondo arriba (evita corte con Dynamic Island)
    marginBottom: 20,    // espacio entre header y secciones
    marginHorizontal: 16
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    // sombra sutil cross-platform
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    gap: 14,
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 2,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#fff" },
  email: { fontSize: 13, color: "#f1f1f1", marginTop: 2 },
});
