// src/screens/GroupDetailScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Image,
  Linking, // <-- añadido
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/type";
import { getGroup, closeGroup, Grupo } from "../services/groups";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useUser } from "../context/UserContext";
import FloatingActionButton from "../components/FloatingActionButton";

type Nav = NativeStackNavigationProp<RootStackParamList, "GroupDetail">;
type Rt = RouteProp<RootStackParamList, "GroupDetail">;

export default function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const rawParam =
    (route?.params as any)?.groupId ?? (route?.params as any)?.grupoId;
  const groupId = Number(rawParam);

  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Grupo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef(false);

  const fmtDate = useMemo(
    () => (s?: string | null) =>
      s
        ? new Date(s).toLocaleString("es-GT", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "—",
    []
  );

  const fetchGroup = useCallback(async () => {
    if (!Number.isInteger(groupId) || groupId <= 0) {
      setError("No se recibió un ID de grupo válido.");
      setLoading(false);
      return;
    }
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setLoading(true);
      setError(null);
      const g = await getGroup(
        groupId,
        user?.id ? { user_id: Number(user.id) } : undefined
      );
      setGroup(g);
    } catch (e: any) {
      console.error("getGroup error:", e?.response?.data || e?.message);
      setError(e?.response?.data?.error || "No se pudo cargar el grupo.");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const isOwner = useMemo(
    () =>
      user?.id != null && group
        ? Number(user.id) === Number(group.conductor_id)
        : false,
    [user?.id, group]
  );

  const cuposTotales = Number(
    group?.capacidad_total ?? group?.cupos_totales ?? 0
  );
  const cuposUsados = Number(group?.cupos_usados ?? 0);
  const cuposDisp = Math.max(0, cuposTotales - cuposUsados);
  const members = group?.miembros ?? [];

  // ⬇️ ¿Usuario es miembro?
  const isMember = useMemo(() => {
    if (!user?.id || !members?.length) return false;
    const uid = Number(user.id);
    return members.some((m: any) => Number(m.id_usuario) === uid);
  }, [members, user?.id]);

  const handleClose = async (
    estado: "cerrado" | "cancelado" | "finalizado"
  ) => {
    try {
      if (!group || !user?.id) return;
      await closeGroup(group.id_grupo, { conductor_id: user.id, estado });
      Alert.alert("Listo", `Grupo ${estado}`);
      await fetchGroup();
    } catch (e: any) {
      console.error("closeGroup error:", e?.response?.data || e?.message);
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudo actualizar el grupo"
      );
    }
  };

  const goToDriverProfile = () => {
    if (!group) return;
    navigation.navigate("DriverProfile", {
      driverId: group.conductor_id,
      rateForGroupId: group.id_grupo,
    } as any);
  };

  // 🎨 Estado → label + colores (cerrado = iniciado)
  const estadoMap: Record<string, { label: string; color: string; bg: string }> =
    {
      abierto: {
        label: "Abierto",
        color: "#2e7d32",
        bg: "rgba(46,125,50,0.15)",
      },
      cerrado: {
        label: "Iniciado",
        color: "#1565c0",
        bg: "rgba(21,101,192,0.15)",
      },
      cancelado: {
        label: "Cancelado",
        color: "#c62828",
        bg: "rgba(198,40,40,0.15)",
      },
      finalizado: {
        label: "Finalizado",
        color: "#616161",
        bg: "rgba(97,97,97,0.15)",
      },
    };
  const estadoInfo = estadoMap[group?.estado ?? ""] ?? {
    label: group?.estado ?? "—",
    color: colors.text,
    bg: colors.card,
  };

  // === SOS: número ficticio + confirmación y llamada ===
  const EMERGENCY_NUMBER = "110";
  const confirmAndCallEmergency = async () => {
    Alert.alert(
      "Emergencia",
      `¿Deseas llamar al número de emergencia?\n${EMERGENCY_NUMBER}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Llamar",
          style: "destructive",
          onPress: async () => {
            const url = `tel:${EMERGENCY_NUMBER}`;
            try {
              const supported = await Linking.canOpenURL(url);
              if (!supported) {
                Alert.alert(
                  "Simulación",
                  "Este dispositivo/emulador no puede abrir el marcador. Se simuló la acción."
                );
                return;
              }
              await Linking.openURL(url);
            } catch (err) {
              console.error("Error abriendo marcador:", err);
              Alert.alert("Error", "No se pudo abrir el marcador telefónico.");
            }
          },
        },
      ]
    );
  };

  const Header = () => (
    <>
      {/* Header tipo ProfileScreen */}
      <Text style={[styles.screenTitle, { color: colors.text }]}>
        Detalle del grupo
      </Text>

      {/* Card de detalles */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Conductor</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {group?.conductor?.nombre} {group?.conductor?.apellido}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Destino</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {group?.viaje?.destino ?? group?.destino_nombre ?? "—"}
        </Text>

        <View style={[styles.estadoPill, { backgroundColor: estadoInfo.bg }]}>
          <Text style={{ color: estadoInfo.color, fontWeight: "700" }}>
            {estadoInfo.label}
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Cupos</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {cuposDisp} / {cuposTotales}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Salida</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {fmtDate(group?.viaje?.fecha_inicio ?? group?.fecha_salida)}
        </Text>

        {/* Botones dinámicos (solo conductor) */}
        {isOwner && (
          <View style={styles.actionsRow}>
            {group?.estado === "abierto" && (
              <>
                <TouchableOpacity
                  onPress={() => handleClose("cerrado")}
                  style={[styles.actionBtn, { backgroundColor: "#1565c0" }]}
                >
                  <Text style={styles.actionTxt}>Iniciar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleClose("cancelado")}
                  style={[styles.actionBtn, { backgroundColor: "#c62828" }]}
                >
                  <Text style={styles.actionTxt}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
            {group?.estado === "cerrado" && (
              <>
                <TouchableOpacity
                  onPress={() => handleClose("finalizado")}
                  style={[styles.actionBtn, { backgroundColor: "#616161" }]}
                >
                  <Text style={styles.actionTxt}>Finalizar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleClose("cancelado")}
                  style={[styles.actionBtn, { backgroundColor: "#c62828" }]}
                >
                  <Text style={styles.actionTxt}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Miembros
      </Text>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text }}>{error}</Text>
      </SafeAreaView>
    );
  }

  // ⬇️ Mostrar SOS si el usuario es miembro y el viaje no está cancelado/finalizado
  const showSOS =
    isMember && group && !["cancelado", "finalizado"].includes(group.estado ?? "");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={members}
        keyExtractor={(m: any) =>
          String(m.id_grupo_miembro ?? `${m.id_usuario}-${m.joined_at}`)
        }
        ListHeaderComponent={<Header />}
        renderItem={({ item }: any) => (
          <View style={[styles.memberRow, { backgroundColor: colors.card }]}>
            {item.usuario?.foto_url ? (
              <Image source={{ uri: item.usuario.foto_url }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={36} color={colors.text} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {item.usuario?.nombre} {item.usuario?.apellido}
              </Text>
              <View
                style={[
                  styles.memberPill,
                  { backgroundColor: "rgba(0,0,0,0.08)" },
                ]}
              >
                <Text style={{ fontSize: 12, color: colors.text }}>
                  {item.rol} · {item.estado_solicitud}
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
      />

      {/* FAB pasajero */}
      {group?.estado === "finalizado" && !isOwner && (
        <FloatingActionButton
          id={`fab_rate_driver_${group.id_grupo}_${user?.id}`}
          icon="thumbs-up"
          label="Calificar conductor"
          backgroundColor={colors.primary}
          onPress={goToDriverProfile}
          style={{ position: "absolute", bottom: 30, right: 20 }}
        />
      )}

      {/* ⬇️ FAB SOS con hold-to-activate + cooldown + haptics */}
      {showSOS && (
        <FloatingActionButton
          id={`fab_sos_${group?.id_grupo}_${user?.id}`}
          icon="alert-circle"
          label="SOS"
          backgroundColor="#D50000"
          color="#fff"
          size={24}
          onPress={confirmAndCallEmergency}
          requireLongPress={true}       // ← mantener presionado para activar
          longPressDelayMs={650}
          cooldownMs={4000}             // ← evita doble disparo
          enableHaptics={true}          // ← vibración corta
          accessibilityLabel="Botón de emergencia SOS"
          accessibilityHint="Mantén presionado para llamar al número de emergencia"
          style={{ position: "absolute", bottom: 50, right: 20, zIndex: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  label: { fontSize: 13, opacity: 0.7, marginTop: 6 },
  value: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  estadoPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 8,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionTxt: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 10 },
  memberRow: {
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: { fontWeight: "700", fontSize: 15 },
  memberPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
});
