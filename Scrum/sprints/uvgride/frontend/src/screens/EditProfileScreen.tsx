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
import { PrimaryButton, AnimatedInput } from "../components";

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

  // ---------------- Form local ----------------
  const [nombre, setNombre] = useState(user?.name || "");
  const [apellido, setApellido] = useState(user?.lastName || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");

  // valores iniciales para detectar cambios
  const initialRef = useRef({
    nombre: user?.name || "",
    apellido: user?.lastName || "",
    telefono: user?.telefono || "",
    photo: user?.photo || null,
  });

  // touched evita que el fetch pise lo escrito
  const touched = useRef(false);
  const onChangeNombre = (v: string) => { touched.current = true; setNombre(v); };
  const onChangeApellido = (v: string) => { touched.current = true; setApellido(v); };
  const onChangeTelefono = (v: string) => { touched.current = true; setTelefono(v); };

  // deshabilitar "Guardar" si no hay cambios
  const dirty =
    nombre.trim() !== (initialRef.current.nombre ?? "") ||
    apellido.trim() !== (initialRef.current.apellido ?? "") ||
    telefono.trim() !== (initialRef.current.telefono ?? "");

  // ---------------- Helpers ----------------
  // base para archivos estáticos (si API_URL termina en /api, se lo quitamos)
  const baseURL = useMemo(
    () => (API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL),
    []
  );
  const avatarUri = user?.photo ?? "https://placehold.co/200x200?text=Avatar";

  // Auth DEV sin JWT: header x-user-id
  const authHeaders = useMemo(
    () => (user?.id ? { "x-user-id": String(user.id) } : {}),
    [user?.id]
  );

  // fetch una sola vez (StrictMode safe)
  const didFetch = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (didFetch.current) {
      setLoading(false);
      return;
    }
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
          initialRef.current = {
            nombre: String(data.nombre ?? ""),
            apellido: String(data.apellido ?? ""),
            telefono: String(data.telefono ?? ""),
            photo: user?.photo ?? null,
          };
        }
      } catch (e: any) {
        console.warn("No se pudo refrescar el perfil, usando contexto:", e?.response?.data || e?.message);
        // aun así setea initial con lo que tenga el contexto
        initialRef.current = {
          nombre: user?.name || "",
          apellido: user?.lastName || "",
          telefono: user?.telefono || "",
          photo: user?.photo || null,
        };
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user?.id]); // solo depende del id

  // ---------------- Actions ----------------
  async function onSave() {
    if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim()) {
      Alert.alert("Campos requeridos", "Nombre, apellido y teléfono son obligatorios.");
      return;
    }
    if (!dirty) {
      Alert.alert("Sin cambios", "No hay nada que guardar.");
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
      // usuario actualizado (sin contrasenia)
      setUserFromBackend(data.user);
      // actualiza baseline para dirty-check
      initialRef.current = {
        ...initialRef.current,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
      };
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

  // Picker robusto: intenta abrir directo; si hay error/permiso, pide y reintenta 1 vez.
  async function onPickAvatar() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
        allowsMultipleSelection: false,
        exif: false,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      await uploadAvatar(res.assets[0].uri);
    } catch (_err) {
      // si falla por permisos, los pedimos y reintentamos
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permiso requerido",
          "Activa el acceso a la galería para elegir tu foto de perfil.",
          [{ text: "Abrir Ajustes", onPress: () => ImagePicker.openSettings() }, { text: "Cancelar", style: "cancel" }]
        );
        return;
      }
      const res2 = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
        allowsMultipleSelection: false,
        exif: false,
      });
      if (res2.canceled || !res2.assets?.[0]?.uri) return;
      await uploadAvatar(res2.assets[0].uri);
    }
  }

  async function uploadAvatar(uri: string) {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("avatar", {
        uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const { data } = await axios.put(`${API_URL}/api/users/me/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data", ...authHeaders },
      });

      const absolute = data?.avatar_url ? `${baseURL}${data.avatar_url}` : null;
      mergeUser({ photo: absolute, photoPath: data?.avatar_url ?? null });

      // marcar dirty falso para foto (no afecta inputs)
      initialRef.current.photo = absolute;

      Alert.alert("Listo", "Foto de perfil actualizada.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  // ---------------- Render ----------------
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
        <Text style={[styles.subtitle, { color: colors.text }]}>Actualiza tu información</Text>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={onPickAvatar} style={styles.avatarButton} activeOpacity={0.8}>
            <View style={styles.avatarShadow}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <Text style={[styles.changePhoto, { color: colors.primary }]}>
              {uploading ? "Subiendo…" : "Cambiar foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
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
          color={dirty ? colors.primary : "#9e9e9e"}
          disabled={!dirty || saving}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 132;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 18, opacity: 0.75 },

  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatarButton: { alignItems: "center" },
  avatarShadow: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  avatar: { width: "100%", height: "100%" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhoto: { fontWeight: "700", marginTop: 10 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
