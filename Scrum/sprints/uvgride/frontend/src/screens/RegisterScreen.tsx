import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "../services/api";
import { RootStackParamList } from "../type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput, LinkText } from "../components";

export default function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo_institucional, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo_usuario, setTipoUsuario] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const handleRegister = async () => {
    if (
      !nombre ||
      !apellido ||
      !correo_institucional ||
      !contrasenia ||
      !telefono ||
      !tipo_usuario
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        nombre,
        apellido,
        correo_institucional,
        contrasenia,
        telefono,
        tipo_usuario,
      });

      Alert.alert("Registrado", `¡Bienvenido ${res.data.usuario.nombre}!`);
      navigation.navigate("Login");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.error || "Error al registrar");
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
        <Text style={[styles.title, { color: colors.primary }]}>
          Crear cuenta
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Completa los campos para registrarte
        </Text>

        {/* Inputs reutilizables */}
        <AnimatedInput
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

        <AnimatedInput
          placeholder="Apellido"
          value={apellido}
          onChangeText={setApellido}
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

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

        <AnimatedInput
          placeholder="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

        {/* Selector de tipo de usuario */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.selector,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text style={{ color: tipo_usuario ? colors.text : "#999" }}>
            {tipo_usuario || "Selecciona un tipo de usuario"}
          </Text>
        </TouchableOpacity>

        {/* Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View
              style={[styles.modalContainer, { backgroundColor: colors.card }]}
            >
              {["Pasajero", "Conductor"].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={styles.modalOption}
                  onPress={() => {
                    setTipoUsuario(tipo);
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Botón reutilizable */}
        <PrimaryButton
          title="Registrarse"
          onPress={handleRegister}
          loading={loading}
          color={colors.primary}
        />

        {/* Link reutilizable */}
        <LinkText
          text="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => navigation.goBack()}
          color={colors.primary}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 32,
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
  selector: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    marginHorizontal: 30,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
});
