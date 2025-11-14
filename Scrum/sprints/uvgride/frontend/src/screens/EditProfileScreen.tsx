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
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { PrimaryButton, AnimatedInput, BackButton } from "../components";

// 🌀 Reanimated sutil
import Animated, {
  FadeInUp,
  FadeIn,
  Layout,
  Easing,
} from "react-native-reanimated";

type RootStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

export default function EditProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUserFromBackend } = useUser();

  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---------------- Form local ----------------
  const [nombre, setNombre] = useState(user?.name || "");
  const [apellido, setApellido] = useState(user?.lastName || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");

  // NUEVOS CAMPOS
  const [bio, setBio] = useState<string>(String((user as any)?.bio ?? ""));
  const [emergNombre, setEmergNombre] = useState<string>(
    String((user as any)?.emerg_contacto_nombre ?? "")
  );
  const [emergTelefono, setEmergTelefono] = useState<string>(
    String((user as any)?.emerg_contacto_telefono ?? "")
  );
  const [accesNecesidades, setAccesNecesidades] = useState<string>(() => {
    const raw = (user as any)?.acces_necesidades;
    if (!raw) return "";
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return "";
    }
  });

  // valores iniciales para detectar cambios
  const initialRef = useRef({
    nombre: user?.name || "",
    apellido: user?.lastName || "",
    telefono: user?.telefono || "",
    bio: String((user as any)?.bio ?? ""),
    emergNombre: String((user as any)?.emerg_contacto_nombre ?? ""),
    emergTelefono: String((user as any)?.emerg_contacto_telefono ?? ""),
    accesNecesidades: (() => {
      const raw = (user as any)?.acces_necesidades;
      if (!raw) return "";
      try {
        return JSON.stringify(raw, null, 2);
      } catch {
        return "";
      }
    })(),
  });

  // touched evita que el fetch pise lo escrito
  const touched = useRef(false);
  const onChangeNombre = (v: string) => {
    touched.current = true;
    setNombre(v);
  };
  const onChangeApellido = (v: string) => {
    touched.current = true;
    setApellido(v);
  };
  const onChangeTelefono = (v: string) => {
    touched.current = true;
    setTelefono(v);
  };
  const onChangeBio = (v: string) => {
    touched.current = true;
    setBio(v);
  };
  const onChangeEmergNombre = (v: string) => {
    touched.current = true;
    setEmergNombre(v);
  };
  const onChangeEmergTelefono = (v: string) => {
    touched.current = true;
    setEmergTelefono(v);
  };
  const onChangeAccesNecesidades = (v: string) => {
    touched.current = true;
    setAccesNecesidades(v);
  };

  // deshabilitar "Guardar" si no hay cambios
  const dirty =
    nombre.trim() !== (initialRef.current.nombre ?? "") ||
    apellido.trim() !== (initialRef.current.apellido ?? "") ||
    telefono.trim() !== (initialRef.current.telefono ?? "") ||
    bio.trim() !== (initialRef.current.bio ?? "") ||
    emergNombre.trim() !== (initialRef.current.emergNombre ?? "") ||
    emergTelefono.trim() !== (initialRef.current.emergTelefono ?? "") ||
    accesNecesidades.trim() !== (initialRef.current.accesNecesidades ?? "");

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

          setBio(String(data.bio ?? ""));
          setEmergNombre(String(data.emerg_contacto_nombre ?? ""));
          setEmergTelefono(String(data.emerg_contacto_telefono ?? ""));
          const acc = data.acces_necesidades
            ? JSON.stringify(data.acces_necesidades, null, 2)
            : "";
          setAccesNecesidades(acc);

          initialRef.current = {
            nombre: String(data.nombre ?? ""),
            apellido: String(data.apellido ?? ""),
            telefono: String(data.telefono ?? ""),
            bio: String(data.bio ?? ""),
            emergNombre: String(data.emerg_contacto_nombre ?? ""),
            emergTelefono: String(data.emerg_contacto_telefono ?? ""),
            accesNecesidades: acc,
          };
        }
      } catch (e: any) {
        console.warn(
          "No se pudo refrescar el perfil, usando contexto:",
          e?.response?.data || e?.message
        );
        // baseline desde contexto
        initialRef.current = {
          nombre: user?.name || "",
          apellido: user?.lastName || "",
          telefono: user?.telefono || "",
          bio: String((user as any)?.bio ?? ""),
          emergNombre: String((user as any)?.emerg_contacto_nombre ?? ""),
          emergTelefono: String((user as any)?.emerg_contacto_telefono ?? ""),
          accesNecesidades: (() => {
            const raw = (user as any)?.acces_necesidades;
            if (!raw) return "";
            try {
              return JSON.stringify(raw, null, 2);
            } catch {
              return "";
            }
          })(),
        };
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // ---------------- Actions ----------------
  function validateClient() {
    if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim()) {
      Alert.alert(
        "Campos requeridos",
        "Nombre, apellido y teléfono son obligatorios."
      );
      return false;
    }
    if (bio && bio.length > 300) {
      Alert.alert("Bio muy larga", "La bio no puede exceder 300 caracteres.");
      return false;
    }
    if (emergNombre && emergNombre.length > 120) {
      Alert.alert("Nombre de emergencia", "No puede exceder 120 caracteres.");
      return false;
    }
    if (emergTelefono) {
      if (emergTelefono.length > 20) {
        Alert.alert(
          "Teléfono de emergencia",
          "No puede exceder 20 caracteres."
        );
        return false;
      }
      const rx = /^[0-9+()\-.\s]{6,20}$/;
      if (!rx.test(emergTelefono)) {
        Alert.alert(
          "Teléfono inválido",
          "Usa solo dígitos y símbolos + ( ) - . espacio (6-20)."
        );
        return false;
      }
    }
    if (accesNecesidades.trim()) {
      try {
        JSON.parse(accesNecesidades);
      } catch {
        Alert.alert(
          "Necesidades especiales",
          'El campo debe ser JSON válido. Ej: {"nota":"ayuda para abordar"}'
        );
        return false;
      }
    }
    return true;
  }

  async function onSave() {
    if (!dirty) {
      Alert.alert("Sin cambios", "No hay nada que guardar.");
      return;
    }
    if (!validateClient()) return;

    try {
      setSaving(true);

      const payload: any = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        bio: bio.trim(),
        emerg_contacto_nombre: emergNombre.trim(),
        emerg_contacto_telefono: emergTelefono.trim(),
      };

      if (accesNecesidades.trim()) {
        payload.acces_necesidades = JSON.parse(accesNecesidades);
      } else {
        payload.acces_necesidades = null;
      }

      const { data } = await axios.put(`${API_URL}/api/users/me`, payload, {
        headers: authHeaders,
      });

      setUserFromBackend(data.user);

      initialRef.current = {
        ...initialRef.current,
        nombre: payload.nombre,
        apellido: payload.apellido,
        telefono: payload.telefono,
        bio: payload.bio ?? "",
        emergNombre: payload.emerg_contacto_nombre ?? "",
        emergTelefono: payload.emerg_contacto_telefono ?? "",
        accesNecesidades: accesNecesidades.trim()
          ? JSON.stringify(payload.acces_necesidades, null, 2)
          : "",
      };

      Alert.alert("Listo", "Perfil actualizado correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudo actualizar el perfil"
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------- Render ----------------
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 8 }}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <BackButton />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header con entrada sutil */}
        <Animated.View
          entering={FadeInUp.duration(180).easing(Easing.out(Easing.quad))}
          layout={Layout}
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            Editar Perfil
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Actualiza tu información
          </Text>
        </Animated.View>

        {/* Formulario con fade corto */}
        <Animated.View
          entering={FadeIn.delay(80).duration(180)}
          layout={Layout}
        >
          {/* Inputs básicos */}
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

          {/* Bio */}
          <AnimatedInput
            placeholder="Bio (máx. 300)"
            value={bio}
            onChangeText={onChangeBio}
            variant="short"
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
            multiline
            numberOfLines={3}
          />

          {/* Contacto de emergencia */}
          <AnimatedInput
            placeholder="Contacto de emergencia - Nombre"
            value={emergNombre}
            onChangeText={onChangeEmergNombre}
            variant="short"
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />
          <AnimatedInput
            placeholder="Contacto de emergencia - Teléfono"
            value={emergTelefono}
            onChangeText={onChangeEmergTelefono}
            variant="phone"
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
          />

          {/* Necesidades especiales (JSON) */}
          <AnimatedInput
            placeholder="Necesidades especiales"
            value={accesNecesidades}
            onChangeText={onChangeAccesNecesidades}
            variant="short"
            textColor={colors.text}
            borderColor={colors.border}
            color={colors.primary}
            multiline
            numberOfLines={4}
          />
          <Text
            style={{
              color: colors.text,
              opacity: 0.6,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Deja vacío si no aplica.
          </Text>

          <PrimaryButton
            title={saving ? "Guardando…" : "Guardar cambios"}
            onPress={onSave}
            loading={saving}
            color={dirty ? colors.primary : "#9e9e9e"}
            disabled={!dirty || saving}
          />
        </Animated.View>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
