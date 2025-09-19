// src/screens/GroupCreateScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/type";
import { createGroup } from "../services/groups";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { AnimatedInput, PrimaryButton, LinkText } from "../components";

function clampInt(v: number, min = 1, max = 99) {
  if (!Number.isFinite(v)) return NaN as unknown as number;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}
function parseCurrency2dec(raw: string): number | null {
  if (raw.trim() === "") return null;
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const normalized =
    parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return NaN as unknown as number;
  return Math.round(n * 100) / 100;
}

type Nav = NativeStackNavigationProp<RootStackParamList, "GroupCreate">;

export default function GroupCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [destino, setDestino] = useState("");
  const [cupos, setCupos] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);
  const [costo, setCosto] = useState("");
  const [loading, setLoading] = useState(false);

  const esConductor = (user?.tipo_usuario || "").toLowerCase() === "conductor";

  /* -------- Validaciones -------- */
  const destinoErr = useMemo(
    () => (destino.trim() ? "" : "Ingresa un destino."),
    [destino]
  );
  const cuposErr = useMemo(() => {
    if (cupos.trim() === "") return "Ingresa el número de cupos.";
    const n = clampInt(Number(cupos), 1, 99);
    if (!Number.isFinite(n)) return "Debe ser un entero.";
    if (n <= 0) return "Debe ser un entero > 0.";
    return "";
  }, [cupos]);
  const costoErr = useMemo(() => {
    if (costo.trim() === "") return "";
    const n = parseCurrency2dec(costo);
    if (n === null) return "";
    if (Number.isNaN(n) || n < 0) return "Ingresa un costo válido (>= 0).";
    return "";
  }, [costo]);

  const isFormValid = !destinoErr && !cuposErr && !costoErr;

  /* -------- Helpers -------- */
  const setCuposMasked = (t: string) => setCupos(t.replace(/[^\d]/g, ""));
  const setCostoMasked = (t: string) => {
    let v = t.replace(/[^\d.,]/g, "");
    const parts = v.replace(",", ".").split(".");
    if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`;
    const [ent, dec] = v.split(/[.,]/);
    if (dec && dec.length > 2) v = `${ent}.${dec.slice(0, 2)}`;
    setCosto(v);
  };
  const fillNowPlus30 = () =>
    setFecha(new Date(Date.now() + 30 * 60 * 1000));

  /* -------- Submit -------- */
  const onSubmit = async () => {
    if (!user?.id) return Alert.alert("Sesión", "Inicia sesión nuevamente.");
    if (!esConductor)
      return Alert.alert(
        "No disponible",
        "Solo los conductores pueden crear grupos."
      );
    if (!isFormValid) {
      return Alert.alert(
        "Revisa el formulario",
        [destinoErr, cuposErr, costoErr].filter(Boolean).join("\n")
      );
    }

    const nCupos = clampInt(Number(cupos), 1, 99);
    const nCosto = parseCurrency2dec(costo);

    try {
      setLoading(true);
      await createGroup({
        conductor_id: Number(user.id),
        destino_nombre: destino.trim(),
        cupos_totales: nCupos,
        fecha_salida: fecha ? fecha.toISOString() : undefined,
        precio_base: nCosto ?? undefined,
      });
      Alert.alert("Éxito", "Grupo creado.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.error("crear grupo error:", e?.response?.data || e?.message);
      Alert.alert("Error", "No se pudo crear el grupo.");
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
          {/* Header */}
          <Text style={[styles.header, { color: colors.text }]}>
            Crear grupo
          </Text>

          {!esConductor && (
            <Text style={[styles.note, { color: colors.text }]}>
              Solo los conductores pueden crear grupos.
            </Text>
          )}

          {/* Destino */}
          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Destino *
            </Text>
            <AnimatedInput
              placeholder="Ej. Cayalá"
              value={destino}
              onChangeText={setDestino}
              variant="short"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          {/* Cupos */}
          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Cupos totales *
            </Text>
            <AnimatedInput
              placeholder="3"
              value={cupos}
              onChangeText={setCuposMasked}
              variant="number"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          {/* Fecha */}
          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Fecha de salida (opcional)
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setShowPicker("date")}
                style={[
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.text }}>
                  {fecha ? fecha.toLocaleDateString() : "Selecciona fecha"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPicker("time")}
                style={[
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.text }}>
                  {fecha
                    ? fecha.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Selecciona hora"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={fillNowPlus30}
                style={[styles.chip, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.chipTxt, { color: colors.text }]}>
                  +30 min
                </Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={fecha ?? new Date()}
                mode={showPicker}
                is24Hour
                onChange={(_, d) => {
                  setShowPicker(null);
                  if (d) setFecha(d);
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Costo */}
          <View style={styles.block}>
            <Text style={[styles.caption, { color: colors.text }]}>
              Costo estimado (opcional)
            </Text>
            <AnimatedInput
              placeholder="50"
              value={costo}
              onChangeText={setCostoMasked}
              variant="number"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          {/* Botón principal */}
          <PrimaryButton
            title="Crear grupo"
            onPress={onSubmit}
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
  note: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  block: { gap: 6, marginBottom: 16 },
  caption: { fontSize: 14, fontWeight: "500", opacity: 0.7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  pickBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  chipTxt: {
    fontWeight: "600",
    fontSize: 13,
  },
});
