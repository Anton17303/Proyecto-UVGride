import React from "react";
import { SafeAreaView, Alert, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import {
  ProfileHeader,
  SectionCard,
  SettingsItem,
  LogoutButton,
  LogoHeader,
} from "../components";
import { lightColors, darkColors } from "../constants/colors";

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  if (!user) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <LogoHeader />
        <Text style={[styles.fallbackText, { color: colors.text }]}>
          No hay usuario logueado.
        </Text>
      </SafeAreaView>
    );
  }

  const esConductor = user.tipo_usuario?.toLowerCase() === "conductor";

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: () => setUser(null) },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LogoHeader />
      {/* Header */}
      <ProfileHeader user={user} />

      {/* Sección Cuenta */}
      <SectionCard title="Cuenta">
        <SettingsItem
          icon="person-circle-outline"
          label="Editar Perfil"
          textColor={colors.text}
          onPress={() => navigation.navigate("EditProfile")}
        />
        <SettingsItem
          icon="trophy-outline"
          label="Logros"
          textColor={colors.text}
          onPress={() => navigation.navigate("Achievements")}
        />

        {esConductor && (
          <SettingsItem
            icon="car-outline"
            label="Registrar Vehículo"
            textColor={colors.text}
            onPress={() => navigation.navigate("VehicleForm")}
          />
        )}
      </SectionCard>

      {/* Sección Preferencias */}
      <SectionCard title="Preferencias">
        <SettingsItem
          icon="moon-outline"
          label="Tema oscuro"
          textColor={colors.text}
          hasSwitch
          switchValue={theme === "dark"}
          onSwitchChange={toggleTheme}
        />
        <SettingsItem
          icon="language-outline"
          label="Idioma"
          textColor={colors.text}
          onPress={() => Alert.alert("Idioma")}
        />
      </SectionCard>

      {/* Sección Legal */}
      <SectionCard title="Legal">
        <SettingsItem
          icon="document-text-outline"
          label="Términos y Condiciones"
          textColor={colors.text}
          onPress={() => Alert.alert("Términos y Condiciones")}
        />
        <SettingsItem
          icon="lock-closed-outline"
          label="Política de Privacidad"
          textColor={colors.text}
          onPress={() => Alert.alert("Política de Privacidad")}
        />
      </SectionCard>

      {/* Logout */}
      <LogoutButton onPress={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: "center",
  },
});
