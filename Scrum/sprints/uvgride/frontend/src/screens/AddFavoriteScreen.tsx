// src/screens/AddFavoriteScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useAchievements } from "../achievements/AchievementsContext"; // 👈 importar

import { PrimaryButton, AnimatedInput, LinkText } from "../components";

const COLORES = [
  "#FF6B6B",
  "#FFB347",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#845EC2",
  "#FF6F91",
  "#00C9A7",
  "#C34A36",
  "#9A9A9A",
];

export default function AddFavoriteScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const { emit, ready } = useAchievements(); // 👈 usar achievements

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [color, setColor] = useState(COLORES[0]);
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim() || !color.trim()) {
      Alert.alert("Error", "El nombre y el color son obligatorios");
      return;
    }

    const nuevoFavorito = {
      id_usuario: user?.id,
      nombre_lugar: nombre.trim(),
      descripcion: descripcion.trim() || null,
      color_hex: color.trim(),
    };

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/favoritos`, nuevoFavorito);

      if (response.status === 201 || response.data?.success) {
        // ✅ Emitir logro ANTES de navegar (para asegurar encolado del modal)
        if (ready) {
          // trata de obtener un id real del backend y si no, usa un fallback
          const createdId =
            response.data?.id ??
            response.data?.favorito?.id ??
            response.data?.data?.id ??
            Date.now();

          emit("FAVORITE_ADDED", {
            favoriteId: createdId,
            name: nombre.trim(),
          });
        }

        Alert.alert("Éxito", "Lugar agregado a favoritos");
        navigation.goBack();
      } else {
        throw new Error("No se pudo guardar el lugar");
      }
    } catch (err: any) {
      console.error("❌ Error al guardar favorito:", err?.response?.data || err.message);
      Alert.alert(
        "Error",
        err?.response?.data?.error || "No se pudo guardar el lugar"
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.header, { color: colors.text }]}>
            Agregar Lugar Favorito
          </Text>

          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Nombre del lugar *
            </Text>
            <AnimatedInput
              placeholder="Ej. Volcán de Pacaya"
              value={nombre}
              onChangeText={setNombre}
              variant="short"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Descripción
            </Text>
            <AnimatedInput
              placeholder="Algo que quieras recordar del lugar"
              value={descripcion}
              onChangeText={setDescripcion}
              variant="long"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Color personalizado *
            </Text>
            <View style={styles.colorGrid}>
              {COLORES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: color === c ? 3 : 1,
                      borderColor: color === c ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          <PrimaryButton
            title="Guardar lugar"
            onPress={handleGuardar}
            loading={loading}
            color={colors.primary}
          />

          <LinkText
            text="← Cancelar"
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
  container: { flex: 1, padding: 20, gap: 20 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  block: { gap: 6, marginBottom: 16 },
  caption: { fontSize: 14, fontWeight: "500", opacity: 0.7 },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
