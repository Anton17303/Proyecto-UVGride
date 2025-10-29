import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { listGroups, joinGroup, Grupo } from "../services/groups";
import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { EmptyState } from "../components";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type EstadoFilter = "todos" | "abierto" | "cerrado" | "cancelado" | "finalizado";
type CupoFilter = "cualquiera" | "con" | "sin";
type FechaFilter = "todos" | "hoy" | "24h" | "semana";
type PrecioFilter = "cualquiera" | "lte20" | "21a50" | "gt50";

const ESTADO_OPTIONS: { label: string; value: EstadoFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Abiertos", value: "abierto" },
  { label: "Iniciados", value: "cerrado" },
  { label: "Cancelados", value: "cancelado" },
  { label: "Finalizados", value: "finalizado" },
];

const CUPO_OPTIONS: { label: string; value: CupoFilter }[] = [
  { label: "Cualquiera", value: "cualquiera" },
  { label: "Con cupos", value: "con" },
  { label: "Sin cupos", value: "sin" },
];

const FECHA_OPTIONS: { label: string; value: FechaFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Hoy", value: "hoy" },
  { label: "24h", value: "24h" },
  { label: "Semana", value: "semana" },
];

const PRECIO_OPTIONS: { label: string; value: PrecioFilter }[] = [
  { label: "Cualquiera", value: "cualquiera" },
  { label: "≤ Q20", value: "lte20" },
  { label: "Q21–50", value: "21a50" },
  { label: "> Q50", value: "gt50" },
];

export default function PassengerScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [cupoFilter, setCupoFilter] = useState<CupoFilter>("cualquiera");
  const [fechaFilter, setFechaFilter] = useState<FechaFilter>("todos");
  const [precioFilter, setPrecioFilter] = useState<PrecioFilter>("cualquiera");

  // Búsqueda
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listGroups(user?.id ? { user_id: Number(user.id) } : undefined);
      setGrupos(data);
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

  const onJoin = async (id: number) => {
    try {
      if (!user?.id) return Alert.alert("Sesión", "Inicia sesión.");
      if (joiningId) return;
      setJoiningId(id);

      // actualización optimista (ajusta cupos_usados para reflejarse en getCuposDisp)
      setGrupos((prev) =>
        prev.map((g) =>
          g.id_grupo !== id
            ? g
            : {
                ...g,
                es_miembro: true,
                cupos_usados:
                  g.cupos_usados != null ? Number(g.cupos_usados) + 1 : (g.cupos_usados as any),
                cupos_disponibles: Math.max(
                  (g.cupos_disponibles ?? g.capacidad_total ?? 0) - 1,
                  0
                ),
              }
        )
      );

      await joinGroup(id, { id_usuario: Number(user.id) });
      Alert.alert("¡Listo!", "Te uniste al grupo");
      fetchData();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.response?.data?.error || "No fue posible unirte");
      fetchData();
    } finally {
      setJoiningId(null);
    }
  };

  const currency = useMemo(
    () => new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }),
    []
  );

  const hasJoinedAny = useMemo(() => grupos.some((g) => g.es_miembro), [grupos]);

  const getCuposDisp = (g: Grupo) => {
    const total = Number(g.capacidad_total ?? g.cupos_totales ?? 0);
    const usados = Number(g.cupos_usados ?? 0);
    return Math.max(0, total - usados);
  };

  // Helpers de filtros
  const isInFechaFilter = (dateISO?: string | null, f: FechaFilter = "todos") => {
    if (!dateISO || f === "todos") return true;
    const now = new Date();
    const d = new Date(dateISO);

    switch (f) {
      case "hoy": {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return d >= start && d < end;
      }
      case "24h": {
        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return d >= now && d <= end;
      }
      case "semana": {
        const end = new Date(now);
        end.setDate(end.getDate() + 7);
        return d >= now && d <= end;
      }
      default:
        return true;
    }
  };

  const isInPrecioFilter = (costo?: number | null, f: PrecioFilter = "cualquiera") => {
    if (costo == null || Number.isNaN(costo) || f === "cualquiera") return true;
    const v = Number(costo);
    if (f === "lte20") return v <= 20;
    if (f === "21a50") return v >= 21 && v <= 50;
    if (f === "gt50") return v > 50;
    return true;
  };

  const matchesSearch = (g: Grupo, q: string) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    const fields: (string | undefined | null)[] = [
      g.viaje?.destino,
      g.destino_nombre,
      (g as any).origen_nombre,
      g.conductor?.nombre,
      g.conductor?.apellido,
    ];
    return fields.some((x) => (x ?? "").toString().toLowerCase().includes(needle));
  };

  const gruposFiltrados = useMemo(() => {
    return grupos.filter((g) => {
      const okEstado = estadoFilter === "todos" ? true : g.estado === estadoFilter;
      if (!okEstado) return false;

      const disp = getCuposDisp(g);
      if (cupoFilter === "con" && disp <= 0) return false;
      if (cupoFilter === "sin" && disp > 0) return false;

      const okFecha = isInFechaFilter(g.fecha_salida ?? null, fechaFilter);
      if (!okFecha) return false;

      const costo = g.costo_estimado != null ? Number(g.costo_estimado) : undefined;
      const okPrecio = isInPrecioFilter(costo, precioFilter);
      if (!okPrecio) return false;

      if (!matchesSearch(g, searchQuery)) return false;

      return true;
    });
  }, [grupos, estadoFilter, cupoFilter, fechaFilter, precioFilter, searchQuery]);

  const EstadoBadge = ({ estado }: { estado: Grupo["estado"] }) => {
    const map: Record<string, string> = {
      abierto: "#2e7d32",
      cerrado: "#1565c0",
      cancelado: "#c62828",
      finalizado: "#616161",
    };
    const label = estado === "cerrado" ? "INICIADO" : estado.toUpperCase();

    return (
      <View style={[styles.badge, { backgroundColor: map[estado] || colors.border }]}>
        <Text style={styles.badgeTxt}>{label}</Text>
      </View>
    );
  };

  const RotatingPill = ({
    label,
    valueLabel,
    onPress,
  }: {
    label: string;
    valueLabel: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} style={[styles.pill, { borderColor: colors.primary }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>
        {label}: <Text style={{ color: colors.primary }}>{valueLabel}</Text>
      </Text>
    </TouchableOpacity>
  );

  const cycleEstado = () => {
    const idx = ESTADO_OPTIONS.findIndex((o) => o.value === estadoFilter);
    setEstadoFilter(ESTADO_OPTIONS[(idx + 1) % ESTADO_OPTIONS.length].value);
  };
  const cycleCupo = () => {
    const idx = CUPO_OPTIONS.findIndex((o) => o.value === cupoFilter);
    setCupoFilter(CUPO_OPTIONS[(idx + 1) % CUPO_OPTIONS.length].value);
  };
  const cycleFecha = () => {
    const idx = FECHA_OPTIONS.findIndex((o) => o.value === fechaFilter);
    setFechaFilter(FECHA_OPTIONS[(idx + 1) % FECHA_OPTIONS.length].value);
  };
  const cyclePrecio = () => {
    const idx = PRECIO_OPTIONS.findIndex((o) => o.value === precioFilter);
    setPrecioFilter(PRECIO_OPTIONS[(idx + 1) % PRECIO_OPTIONS.length].value);
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const cuposTotales = Number(item.capacidad_total ?? item.cupos_totales ?? 0);
    const cuposDisp = getCuposDisp(item);

    const isOwner = Number(user?.id) === Number(item.conductor_id);
    const isMemberHere = Boolean(item.es_miembro);
    const isOpen = item.estado === "abierto";

    const disabledJoin = isOwner || !isOpen || cuposDisp <= 0 || (hasJoinedAny && !isMemberHere);

    const joinLabel = isOwner
      ? "Tu grupo"
      : isMemberHere
      ? "Ya unido"
      : !isOpen
      ? "No disponible"
      : cuposDisp <= 0
      ? "Sin cupos"
      : hasJoinedAny
      ? "Unido en otro"
      : joiningId === item.id_grupo
      ? "Uniendo..."
      : "Unirse";

    const canSeeDetail = isOwner || isMemberHere;

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {item.conductor?.nombre} {item.conductor?.apellido}
          </Text>
          <EstadoBadge estado={item.estado} />
        </View>

        {/* Info */}
        <Text style={{ color: colors.text, marginBottom: 2 }}>
          <Text style={styles.label}>Destino: </Text>
          {item.viaje?.destino ?? item.destino_nombre ?? "—"}
        </Text>
        <Text style={{ color: colors.text, marginBottom: 2 }}>
          <Text style={styles.label}>Cupos: </Text>
          {cuposDisp} / {cuposTotales}
        </Text>
        {item.costo_estimado != null && (
          <Text style={{ color: colors.text, marginBottom: 4 }}>
            <Text style={styles.label}>Estimado: </Text>
            {currency.format(Number(item.costo_estimado))}
          </Text>
        )}
        {item.fecha_salida && (
          <Text style={{ color: colors.text, marginBottom: 6 }}>
            <Text style={styles.label}>Salida: </Text>
            {new Date(item.fecha_salida).toLocaleString("es-GT", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        )}

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onJoin(item.id_grupo)}
            style={[
              styles.joinBtn,
              { backgroundColor: disabledJoin ? "#9e9e9e" : colors.primary },
            ]}
            disabled={disabledJoin}
          >
            {joiningId === item.id_grupo ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>{joinLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              canSeeDetail && navigation.navigate("GroupDetail", { grupoId: item.id_grupo })
            }
            disabled={!canSeeDetail}
            style={[
              styles.detailBtn,
              {
                borderColor: canSeeDetail ? colors.primary : "#ccc",
                opacity: canSeeDetail ? 1 : 0.6,
              },
            ]}
          >
            <Text
              style={[styles.detailTxt, { color: canSeeDetail ? colors.primary : "#aaa" }]}
            >
              Ver detalle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Lógica del botón de lupa
  const toggleSearch = () => {
    if (searchActive) {
      if (searchQuery.length > 0) setSearchQuery("");
      else setSearchActive(false);
    } else {
      setSearchActive(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>Grupos</Text>

      {/* Filtros (ordenados por prioridad) */}
      <View style={styles.toolbar}>
        {/* 1) Búsqueda (lupa) */}
        <TouchableOpacity
          onPress={toggleSearch}
          style={[styles.roundBtn, { backgroundColor: "#fff" }]}
          accessibilityLabel={searchActive || searchQuery ? "Cerrar búsqueda" : "Buscar grupos"}
        >
          <Ionicons
            name={searchActive || searchQuery ? "close-outline" : "search-outline"}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* 2) Estado */}
        <RotatingPill
          label="Estado"
          valueLabel={ESTADO_OPTIONS.find((o) => o.value === estadoFilter)?.label ?? "Todos"}
          onPress={cycleEstado}
        />

        {/* 3) Fecha */}
        <RotatingPill
          label="Fecha"
          valueLabel={FECHA_OPTIONS.find((o) => o.value === fechaFilter)?.label ?? "Todos"}
          onPress={cycleFecha}
        />

        {/* 4) Cupos */}
        <RotatingPill
          label="Cupos"
          valueLabel={CUPO_OPTIONS.find((o) => o.value === cupoFilter)?.label ?? "Cualquiera"}
          onPress={cycleCupo}
        />

        {/* 5) Precio */}
        <RotatingPill
          label="Precio"
          valueLabel={PRECIO_OPTIONS.find((o) => o.value === precioFilter)?.label ?? "Cualquiera"}
          onPress={cyclePrecio}
        />

        {/* 6) Reset */}
        <TouchableOpacity
          onPress={() => {
            setEstadoFilter("todos");
            setCupoFilter("cualquiera");
            setFechaFilter("todos");
            setPrecioFilter("cualquiera");
            setSearchQuery("");
            setSearchActive(false);
          }}
          style={[styles.roundBtn, { backgroundColor: "#fff" }]}
          accessibilityLabel="Restablecer filtros"
        >
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      {searchActive && (
        <View style={[styles.searchBar, { borderColor: colors.primary, backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por destino, origen o conductor"
            placeholderTextColor={colors.muted || "#888"}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.searchClear}>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : gruposFiltrados.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title={grupos.length === 0 ? "No hay grupos disponibles" : "Sin resultados"}
          subtitle={
            grupos.length === 0
              ? "Aún no se han creado grupos de viaje. ¡Sé el primero en unirte cuando aparezcan!"
              : "No se encontraron grupos con los filtros seleccionados."
          }
          color={colors.primary}
          textColor={colors.text}
        />
      ) : (
        <FlatList
          data={gruposFiltrados}
          keyExtractor={(item) => String(item.id_grupo)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
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

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
    flexWrap: "wrap",
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 12, fontWeight: "700" },

  roundBtn: {
    padding: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },

  // barra de búsqueda
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 10,
    alignSelf: "center",
    minWidth: "92%",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  searchClear: {
    paddingLeft: 6,
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
  joinBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  joinBtnText: { color: "#fff", fontWeight: "700" },

  detailBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  detailTxt: { fontWeight: "700" },
});
