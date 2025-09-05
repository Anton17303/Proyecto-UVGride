import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput, LinkText } from "../components";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Tabs: undefined;
};

export default function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [correo_institucional, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUserFromBackend } = useUser();

  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const handleLogin = async () => {
    if (!correo_institucional || !contrasenia) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        correo_institucional,
        contrasenia,
      });
      setUserFromBackend(res.data.usuario);
      Alert.alert("¡Bienvenido!", `Hola ${res.data.usuario.nombre}`);
      navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.error || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={[styles.appName, { color: colors.primary }]}>
          UVGride
        </Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Inicia sesión para continuar
        </Text>

        <AnimatedInput
          placeholder="Correo institucional"
          value={correo_institucional}
          onChangeText={setCorreo}
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

        <AnimatedInput
          placeholder="Contraseña"
          value={contrasenia}
          onChangeText={setContrasenia}
          secureTextEntry
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

        <PrimaryButton
          title="Iniciar Sesión"
          onPress={handleLogin}
          loading={loading}
          color={colors.primary}
        />

        <LinkText
          text="¿No tienes cuenta? Regístrate"
          onPress={() => navigation.navigate("Register")}
          color={colors.primary}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  appName: {
    fontSize: 44,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
});
