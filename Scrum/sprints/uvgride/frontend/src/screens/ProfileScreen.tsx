import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: () => setUser(null) },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text, textAlign: "center", marginTop: 50 }}>
          No hay usuario logueado.
        </Text>
      </SafeAreaView>
    );
  }

  const esConductor = user.tipo_usuario?.toLowerCase() === "conductor";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header como card verde */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerCard}>
          <Image
            source={require("../assets/default-profile.jpg")}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* Sección Cuenta */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuenta</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.itemText, { color: colors.text }]}>Editar Perfil</Text>
        </TouchableOpacity>

        {esConductor && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("VehicleForm")}
          >
            <Ionicons name="car-outline" size={20} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>
              Registrar Vehículo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sección Preferencias */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferencias
        </Text>

        <View style={styles.item}>
          <Ionicons name="moon-outline" size={20} color={colors.primary} />
          <Text style={[styles.itemText, { color: colors.text }]}>Tema oscuro</Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#ccc", true: colors.primary }}
            thumbColor={theme === "dark" ? "#fff" : "#f4f3f4"}
            style={{ marginLeft: "auto" }}
          />
        </View>

        <TouchableOpacity style={styles.item} onPress={() => Alert.alert("Idioma")}>
          <Ionicons name="language-outline" size={20} color={colors.primary} />
          <Text style={[styles.itemText, { color: colors.text }]}>Idioma</Text>
        </TouchableOpacity>
      </View>

      {/* Sección Legal */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => Alert.alert("Términos y Condiciones")}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.itemText, { color: colors.text }]}>
            Términos y Condiciones
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => Alert.alert("Política de Privacidad")}
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={[styles.itemText, { color: colors.text }]}>
            Política de Privacidad
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    marginTop: 20,
    marginBottom: 20, // <-- espacio entre header y opciones
    marginHorizontal: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 20, // <-- redondeado también arriba
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 16,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#fff" },
  email: { fontSize: 13, color: "#f1f1f1", marginTop: 2 },
  sectionCard: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    opacity: 0.6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemText: {
    fontSize: 15,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d9534f",
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 60,
    marginTop: "auto",
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
