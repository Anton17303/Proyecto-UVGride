// src/screens/DriverTripScreen.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/type";
import { listGroups, closeGroup, Grupo } from "../services/groups";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useUser } from "../context/UserContext";
import EmptyState from "../components/EmptyState";
import FloatingActionButton from "../components/FloatingActionButton";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriverTripScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [joinedOther, setJoinedOther] = useState(false);
  const [closingId, setClosingId] = useState<number | null>(null);

  const fmtDate = useMemo(
    () => (s?: string | null) =>
      s
        ? new Date(s).toLocaleString("es-GT", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "Por definir",
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const all = await listGroups(user?.id ? { user_id: Number(user.id) } : undefined);
      const mine = user?.id ? all.filter((g) => g.conductor_id === Number(user.id)) : [];
      setGrupos(mine);

      const iJoinedOther =
        user?.id ? all.some((g) => g.es_miembro === true && g.es_propietario !== true) : false;
      setJoinedOther(iJoinedOther);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No se pudieron cargar los grupos");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const doClose = async (g: Grupo, estado: "cerrado" | "cancelado" | "finalizado") => {
    try {
      if (!user?.id) return Alert.alert("Sesión", "Inicia sesión.");
      if (closingId) return;
      setClosingId(g.id_grupo);

      await closeGroup(g.id_grupo, { conductor_id: user.id, estado });
      Alert.alert("Listo", `Grupo ${estado}`);
      fetchData();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No se pudo actualizar el grupo");
    } finally {
      setClosingId(null);
    }
  };

  const EstadoBadge = ({ estado }: { estado: Grupo["estado"] }) => {
    const map: Record<string, { color: string; label: string }> = {
      abierto: { color: "#2e7d32", label: "ABIERTO" },
      cerrado: { color: "#1565c0", label: "INICIADO" },
      cancelado: { color: "#c62828", label: "CANCELADO" },
      finalizado: { color: "#616161", label: "FINALIZADO" },
    };
    const { color, label } = map[estado] || { color: colors.border, label: estado };
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeTxt}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const cuposTotales = Number(item.capacidad_total ?? item.cupos_totales ?? 0);
    const cuposUsados = Number(item.cupos_usados ?? 0);
    const cuposDisp = Math.max(0, cuposTotales - cuposUsados);

    const isBusy = closingId === item.id_grupo;
    const v = item.conductor?.vehiculos?.[0];

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {item.viaje?.destino ?? item.destino_nombre ?? "Destino"}
          </Text>
          <EstadoBadge estado={item.estado} />
        </View>

        {/* Info */}
        {v && (
          <Text style={{ color: colors.text, marginBottom: 2 }}>
            <Text style={styles.label}>Vehículo: </Text>
            {v.marca} {v.modelo} · {v.placa}
          </Text>
        )}
        <Text style={{ color: colors.text, marginBottom: 2 }}>
          <Text style={styles.label}>Cupos: </Text>
          {cuposDisp} / {cuposTotales}
        </Text>
        {item.costo_estimado != null && (
          <Text style={{ color: colors.text, marginBottom: 2 }}>
            <Text style={styles.label}>Estimado: </Text>
            Q{Number(item.costo_estimado).toFixed(2)}
          </Text>
        )}
        <Text style={{ color: colors.text, marginBottom: 6 }}>
          <Text style={styles.label}>Salida: </Text>
          {fmtDate(item.viaje?.fecha_inicio ?? item.fecha_salida)}
        </Text>

        {/* Botones dinámicos */}
        <View style={styles.actionsRow}>
          {item.estado === "abierto" && (
            <>
              <TouchableOpacity
                onPress={() => doClose(item, "cerrado")}
                disabled={isBusy}
                style={[styles.actionBtn, { backgroundColor: "#1565c0", flex: 1 }]}
              >
                <Text style={styles.actionTxt}>{isBusy ? "..." : "Iniciar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => doClose(item, "cancelado")}
                disabled={isBusy}
                style={[styles.actionBtn, { backgroundColor: "#c62828", flex: 1 }]}
              >
                <Text style={styles.actionTxt}>{isBusy ? "..." : "Cancelar"}</Text>
              </TouchableOpacity>
            </>
          )}
          {item.estado === "cerrado" && (
            <>
              <TouchableOpacity
                onPress={() => doClose(item, "finalizado")}
                disabled={isBusy}
                style={[styles.actionBtn, { backgroundColor: "#616161", flex: 1 }]}
              >
                <Text style={styles.actionTxt}>{isBusy ? "..." : "Finalizar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => doClose(item, "cancelado")}
                disabled={isBusy}
                style={[styles.actionBtn, { backgroundColor: "#c62828", flex: 1 }]}
              >
                <Text style={styles.actionTxt}>{isBusy ? "..." : "Cancelar"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const esConductor = (user?.tipo_usuario || "").toLowerCase() === "conductor";
  const createDisabled = joinedOther || !esConductor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>Mis grupos</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : grupos.length === 0 ? (
        <EmptyState
          icon="car-sport-outline"
          title="Aún no tienes grupos"
          subtitle="Crea tu primer grupo de viaje y empieza a recibir pasajeros"
          color={colors.primary}
          textColor={colors.text}
        />
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => String(item.id_grupo)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* FAB crear grupo */}
      {esConductor && (
        <FloatingActionButton
          id="fab_create_group"
          icon="add"
          label="Crear grupo"
          backgroundColor={colors.primary}
          disabled={createDisabled}
          onPress={() => {
            if (createDisabled) {
              return Alert.alert(
                "No disponible",
                joinedOther
                  ? "No puedes crear un grupo porque estás unido en otro como pasajero."
                  : "Solo los conductores pueden crear grupos."
              );
            }
            navigation.navigate("GroupCreate");
          }}
          style={{ position: "absolute", bottom: 30, right: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 8,
  },
  card: {
    width: "93%",
    alignSelf: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  label: { fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionTxt: { color: "#fff", fontWeight: "700" },
});
