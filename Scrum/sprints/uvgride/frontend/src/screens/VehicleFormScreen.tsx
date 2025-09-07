import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import axios from "axios";
import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput, LinkText } from "../components";

export default function VehicleFormScreen({ navigation }: any) {
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [color, setColor] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!marca || !modelo || !placa || !color || !capacidad) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/vehiculos`, {
        id_usuario: user?.id,
        marca,
        modelo,
        placa,
        color,
        capacidad_pasajeros: parseInt(capacidad),
      });

      Alert.alert("Éxito", "Vehículo registrado correctamente");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error registrando vehículo:", error);
      Alert.alert("Error", "No se pudo registrar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            Registrar vehículo
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Completa la información de tu vehículo
          </Text>

          <AnimatedInput
            placeholder="Marca"
            value={marca}
            onChangeText={setMarca}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          <AnimatedInput
            placeholder="Modelo"
            value={modelo}
            onChangeText={setModelo}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          <AnimatedInput
            placeholder="Placa"
            value={placa}
            onChangeText={setPlaca}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          <AnimatedInput
            placeholder="Color"
            value={color}
            onChangeText={setColor}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          <AnimatedInput
            placeholder="Capacidad de pasajeros"
            value={capacidad}
            onChangeText={setCapacidad}
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          <PrimaryButton
            title="Registrar vehículo"
            onPress={handleRegister}
            loading={loading}
            color={colors.primary}
          />

          <LinkText
            text="Cancelar"
            onPress={() => navigation.goBack()}
            color={colors.primary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
  },
});
