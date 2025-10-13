// src/screens/EditProfileScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput } from "../components/index";

type RootStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

export default function EditProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUserFromBackend, mergeUser } = useUser();

  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [nombre, setNombre] = useState(user?.name || "");
  const [apellido, setApellido] = useState(user?.lastName || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");

  // Evita que hidrataciones posteriores pisen lo que el usuario ya escribió
  const touched = useRef(false);
  const onChangeNombre = (v: string) => { touched.current = true; setNombre(v); };
  const onChangeApellido = (v: string) => { touched.current = true; setApellido(v); };
  const onChangeTelefono = (v: string) => { touched.current = true; setTelefono(v); };

  // Evitar múltiples fetch por StrictMode / re-renders
  const didFetch = useRef(false);

  // Base para archivos estáticos (si API_URL termina en /api, se lo quitamos)
  const baseURL = useMemo(
    () => (API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL),
    []
  );
  const avatarUri = user?.photo ?? "https://placehold.co/120x120";

  // Auth temporal sin JWT: enviaremos x-user-id con el id del contexto
  const authHeaders = useMemo(
    () => (user?.id ? { "x-user-id": String(user.id) } : {}),
    [user?.id]
  );

  // Cargar perfil desde backend SOLO una vez; si el usuario ya tocó, no pisar inputs
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    if (didFetch.current) { setLoading(false); return; }
    didFetch.current = true;

    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/users/me`, {
          headers: authHeaders,
        });
        if (!mounted) return;

        setUserFromBackend(data); // sincroniza contexto

        if (!touched.current) {
          setNombre(String(data.nombre ?? ""));
          setApellido(String(data.apellido ?? ""));
          setTelefono(String(data.telefono ?? ""));
        }
      } catch (e: any) {
        console.warn(
          "No se pudo refrescar el perfil, usando contexto:",
          e?.response?.data || e?.message
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
    // Solo depende de la presencia del id para correr una vez
  }, [user?.id]); 

  async function onSave() {
    if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim()) {
      Alert.alert("Campos requeridos", "Nombre, apellido y teléfono son obligatorios.");
      return;
    }
    try {
      setSaving(true);
      const { data } = await axios.put(
        `${API_URL}/api/users/me`,
        {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim(),
        },
        { headers: authHeaders }
      );
      // data.user es el usuario actualizado
      setUserFromBackend(data.user);
      Alert.alert("Listo", "Perfil actualizado correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar() {
    // 1) Permisos
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let perm = current;
    if (!current.granted) {
      perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    if (!perm.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para elegir tu foto de perfil.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir Ajustes", onPress: () => ImagePicker.openSettings() },
        ]
      );
      return;
    }

    // 2) Abrir galería
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.85,
      allowsEditing: false,
      selectionLimit: 1,
      exif: false,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;

    // 3) Subir archivo
    try {
      setUploading(true);
      const form = new FormData();
      form.append("avatar", {
        uri: res.assets[0].uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const { data } = await axios.put(`${API_URL}/api/users/me/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data", ...authHeaders },
      });

      const absolute = data?.avatar_url ? `${baseURL}${data.avatar_url}` : null;
      mergeUser({ photo: absolute, photoPath: data?.avatar_url ?? null });

      Alert.alert("Listo", "Foto de perfil actualizada.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Editar Perfil</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Actualiza tu información
        </Text>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={onPickAvatar} style={styles.avatarButton}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <Text style={[styles.changePhoto, { color: colors.primary }]}>
              {uploading ? "Subiendo…" : "Cambiar foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs (con touched) */}
        <AnimatedInput
          placeholder="Nombre"
          value={nombre}
          onChangeText={onChangeNombre}
          variant="short"
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />
        <AnimatedInput
          placeholder="Apellido"
          value={apellido}
          onChangeText={onChangeApellido}
          variant="short"
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />
        <AnimatedInput
          placeholder="Teléfono"
          value={telefono}
          onChangeText={onChangeTelefono}
          variant="phone"
          textColor={colors.text}
          borderColor={colors.border}
          color={colors.primary}
        />

        <PrimaryButton
          title={saving ? "Guardando…" : "Guardar cambios"}
          onPress={onSave}
          loading={saving}
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
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
    opacity: 0.75,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarButton: { alignItems: "center" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 8 },
  changePhoto: { fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
