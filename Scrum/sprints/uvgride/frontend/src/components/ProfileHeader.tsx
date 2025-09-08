import React from "react";
import { View, Text, Image, StyleSheet, Switch } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../context/ThemeContext";

type Props = {
  user: any;
};

export default function ProfileHeader({ user }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, toggleTheme } = useTheme();

  // Verde sólido en ambos temas
  const backgroundColor = theme === "light" ? "#4CAF50" : "#2E7D32";

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <Image
        source={require("../assets/default-profile.jpg")}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* Botón editar perfil */}
      <View style={styles.editButton}>
        <Text
          style={styles.editButtonText}
          onPress={() => navigation.navigate("EditProfile")}
        >
          Editar Perfil
        </Text>
      </View>

      {/* Switch de tema */}
      <View style={styles.themeToggle}>
        <Ionicons
          name={theme === "dark" ? "moon" : "sunny"}
          size={18}
          color="#fff"
        />
        <Switch
          value={theme === "dark"}
          onValueChange={toggleTheme}
          trackColor={{ false: "#ccc", true: "#333" }}
          thumbColor={theme === "dark" ? "#fff" : "#f4f3f4"}
          style={{ marginHorizontal: 8 }}
        />
        <Text style={styles.themeText}>
          {theme === "dark" ? "Modo oscuro" : "Modo claro"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: 40, // más compacto, aún cubre notch
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 2 },
  email: { fontSize: 13, color: "#eee", marginBottom: 10 },
  editButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  themeText: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
});
