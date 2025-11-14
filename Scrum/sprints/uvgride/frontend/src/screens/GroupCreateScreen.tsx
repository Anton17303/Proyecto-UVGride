// src/screens/GroupCreateScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/type";
import { createGroup } from "../services/groups";
import { searchUsers, type UserLite } from "../services/users";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { AnimatedInput, PrimaryButton, LinkText, BackButton } from "../components";
import { useAchievements } from "../achievements/AchievementsContext"; // 👈 NUEVO

/* ---------------- Utils num ---------------- */
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

/* ---------------- Types ---------------- */
type Nav = NativeStackNavigationProp<RootStackParamList, "GroupCreate">;

/* ======================================================================= */
export default function GroupCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const { emit, ready } = useAchievements(); // 👈 NUEVO

  const [destino, setDestino] = useState("");
  const [cupos, setCupos] = useState("3");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);
  const [costo, setCosto] = useState("");
  const [loading, setLoading] = useState(false);

  // Recurrente + asignación por nombre
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserLite[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);

  const esConductor = (user?.tipo_usuario || "").toLowerCase() === "conductor";
  const conductorId = Number(user?.id) || 0;

  /* ---------------- Validaciones ---------------- */
  const destinoErr = useMemo(
    () => (destino.trim() ? "" : "Ingresa un destino."),
    [destino]
  );
  const nCupos = useMemo(() => clampInt(Number(cupos), 1, 99), [cupos]);

  const cuposErr = useMemo(() => {
    if (cupos.trim() === "") return "Ingresa el número de cupos.";
    if (!Number.isFinite(nCupos)) return "Debe ser un entero.";
    if (nCupos <= 0) return "Debe ser un entero > 0.";
    return "";
  }, [cupos, nCupos]);

  const costoNum = useMemo(() => parseCurrency2dec(costo), [costo]);
  const costoErr = useMemo(() => {
    if (costo.trim() === "") return "";
    if (costoNum === null) return "";
    if (Number.isNaN(costoNum) || (costoNum as number) < 0)
      return "Ingresa un costo válido (>= 0).";
    return "";
  }, [costo, costoNum]);

  const designadosErr = useMemo(() => {
    if (!esRecurrente) return "";
    if (!Number.isFinite(nCupos)) return "";
    const totalOcupantes = 1 + selectedUsers.length; // conductor + designados
    if (totalOcupantes > nCupos) {
      return `Capacidad insuficiente: conductor + ${selectedUsers.length} designados exceden ${nCupos} cupos.`;
    }
    return "";
  }, [esRecurrente, selectedUsers.length, nCupos]);

  const isFormValid =
    !destinoErr && !cuposErr && !costoErr && !designadosErr && !!destino.trim();

  /* ---------------- Handlers simples ---------------- */
  const setCuposMasked = (t: string) => setCupos(t.replace(/[^\d]/g, ""));
  const setCostoMasked = (t: string) => {
    let v = t.replace(/[^\d.,]/g, "");
    const parts = v.replace(",", ".").split(".");
    if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`;
    const [ent, dec] = v.split(/[.,]/);
    if (dec && dec.length > 2) v = `${ent}.${dec.slice(0, 2)}`;
    setCosto(v);
  };
  const fillNowPlus30 = () => setFecha(new Date(Date.now() + 30 * 60 * 1000));

  /* ---------------- Búsqueda por nombre (debounced) ---------------- */
  useEffect(() => {
    let alive = true;
    const term = query.trim();

    if (!esRecurrente || term.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return () => {
        alive = false;
      };
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(term, 10, { userId: conductorId });
        if (!alive) return;
        const existingIds = new Set<number>([
          conductorId,
          ...selectedUsers.map((u) => u.id_usuario),
        ]);
        const filtered = res.filter((u) => !existingIds.has(u.id_usuario));
        setSuggestions(filtered);
      } catch {
        if (alive) setSuggestions([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, esRecurrente, conductorId, selectedUsers]);

  const addUser = (u: UserLite) => {
    if (u.id_usuario === conductorId) return;
    if (selectedUsers.some((x) => x.id_usuario === u.id_usuario)) return;
    setSelectedUsers((prev) => [...prev, u]);
    setQuery("");
    setSuggestions([]);
  };

  const removeUser = (id: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id_usuario !== id));
  };

  /* ---------------- Submit ---------------- */
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
        [destinoErr, cuposErr, costoErr, designadosErr].filter(Boolean).join("\n")
      );
    }

    try {
      setLoading(true);

      // Llama al servicio y toma el ID creado
      const created = await createGroup({
        conductor_id: Number(user.id),
        destino_nombre: destino.trim(),
        cupos_totales: nCupos,
        fecha_salida: fecha ? fecha.toISOString() : undefined,
        precio_base: (costoNum ?? undefined) as number | undefined,
        es_recurrente: esRecurrente,
        miembros_designados:
          esRecurrente && selectedUsers.length > 0
            ? selectedUsers.map((u) => u.id_usuario)
            : undefined,
      });

      // Intenta resolver el ID desde diferentes firmas de respuesta
      const createdId =
        (created && (created.id_grupo ?? created.id ?? created.groupId)) ?? Date.now();

      // ✅ Emite el evento para el logro "first_group"
      if (ready) {
        emit("GROUP_CREATED", { groupId: createdId });
      }

      Alert.alert("Éxito", "Grupo creado.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.error("crear grupo error:", e?.response?.data || e?.message);
      const msg =
        e?.response?.data?.error || e?.message || "No se pudo crear el grupo.";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Render ---------------- */
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <BackButton />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.header, { color: colors.text }]}>Crear grupo</Text>

          {!esConductor && (
            <Text style={[styles.note, { color: colors.text }]}>
              Solo los conductores pueden crear grupos.
            </Text>
          )}

          {/* Destino */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: colors.text }]}>Destino *</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>
              Cupos totales *
            </Text>
            <AnimatedInput
              placeholder="3"
              value={cupos}
              onChangeText={(t) => setCuposMasked(t)}
              variant="number"
              textColor={colors.text}
              borderColor={colors.border}
              color={colors.primary}
            />
          </View>

          {/* Fecha */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: colors.text }]}>
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
                    ? fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Selecciona hora"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={fillNowPlus30}
                style={[styles.chip, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.chipTxt, { color: colors.text }]}>+30 min</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>
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

          {/* Switch recurrente */}
          <View style={[styles.block, styles.rowBetween]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text }]}>Viaje recurrente</Text>
              <Text style={[styles.help, { color: colors.text }]}>
                Si está activado, el grupo se crea <Text style={{ fontWeight: "700" }}>cerrado</Text> y podrás
                agregar miembros designados.
              </Text>
            </View>
            <Switch
              value={esRecurrente}
              onValueChange={(v) => {
                setEsRecurrente(v);
                if (!v) {
                  setSelectedUsers([]);
                  setQuery("");
                  setSuggestions([]);
                  setSearching(false);
                }
              }}
            />
          </View>

          {/* Búsqueda y selección de miembros (solo recurrente) */}
          {esRecurrente && (
            <View style={styles.block}>
              <Text style={[styles.label, { color: colors.text }]}>Miembros designados</Text>

              {/* Chips seleccionados */}
              {selectedUsers.length > 0 && (
                <View style={styles.chipsWrap}>
                  {selectedUsers.map((u) => (
                    <View
                      key={u.id_usuario}
                      style={[
                        styles.chipPill,
                        { borderColor: colors.border, backgroundColor: colors.card },
                      ]}
                    >
                      <Text style={[styles.chipPillTxt, { color: colors.text }]}>
                        {u.nombre} {u.apellido}
                      </Text>
                      <TouchableOpacity onPress={() => removeUser(u.id_usuario)} style={styles.chipClose}>
                        <Ionicons name="close" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Input búsqueda */}
              <View
                style={[
                  styles.searchRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Ionicons name="search-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar por nombre, apellido o correo"
                  placeholderTextColor={colors.muted || "#888"}
                  style={[styles.searchInput, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searching ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Sugerencias */}
              {esRecurrente && query.trim().length >= 2 && (
                <View
                  style={[
                    styles.suggestionsBox,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  {searching ? (
                    <View style={{ padding: 12 }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : suggestions.length === 0 ? (
                    <View style={{ padding: 12 }}>
                      <Text style={{ color: colors.muted || "#777" }}>
                        No se encontraron usuarios para “{query.trim()}”.
                      </Text>
                    </View>
                  ) : (
                    suggestions.map((u) => (
                      <TouchableOpacity
                        key={u.id_usuario}
                        style={styles.suggestionItem}
                        onPress={() => addUser(u)}
                      >
                        <Text style={{ color: colors.text, fontWeight: "600" }}>
                          {u.nombre} {u.apellido}
                        </Text>
                        {u.correo_institucional ? (
                          <Text style={{ color: colors.muted || "#777", fontSize: 12 }}>
                            {u.correo_institucional}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Ayuda / error */}
              <Text
                style={[
                  styles.help,
                  { color: designadosErr ? colors.danger || "#d00" : colors.text },
                ]}
              >
                {designadosErr
                  ? designadosErr
                  : `Se agregarán ${selectedUsers.length} pasajeros aprobados. La capacidad incluye al conductor.`}
              </Text>
            </View>
          )}

          {/* Botón principal */}
          <PrimaryButton
            title="Crear grupo"
            onPress={onSubmit}
            loading={loading}
            color={colors.primary}
            disabled={!isFormValid || !esConductor}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContainer: { padding: 20, flexGrow: 1 },
  header: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  note: { fontSize: 13, marginBottom: 16, textAlign: "center", opacity: 0.8 },
  block: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "500", opacity: 0.7, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "space-between" },
  pickBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  chipTxt: { fontWeight: "600", fontSize: 13 },
  help: { fontSize: 12, opacity: 0.8, marginTop: 4 },

  // búsqueda y chips
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  suggestionsBox: { borderWidth: 1, borderRadius: 10, marginTop: 6, overflow: "hidden" },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000010",
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  chipPillTxt: { fontSize: 12, fontWeight: "700" },
  chipClose: { padding: 2 },
});
