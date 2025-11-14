// src/screens/PassengerScreen.tsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
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

// 🌀 Reanimated
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInUp,
  Layout,
} from "react-native-reanimated";

import { listGroups, joinGroup, leaveGroup, Grupo } from "../services/groups";
import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { EmptyState } from "../components";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type EstadoFilter =
  | "todos"
  | "abierto"
  | "cerrado"
  | "cancelado"
  | "finalizado";
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

/* =========================================================
   Badges reutilizables
   ========================================================= */

type ColorPalette = {
  primary: string;
  text: string;
  card: string;
  border: string;
  muted?: string;
};

function EstadoBadge({
  estado,
  esRecurrente,
  colors,
}: {
  estado: Grupo["estado"];
  esRecurrente?: boolean;
  colors: ColorPalette;
}) {
  const map: Record<string, string> = {
    abierto: "#2e7d32",
    cerrado: "#1565c0",
    cancelado: "#c62828",
    finalizado: "#616161",
  };
  const label =
    estado === "cerrado"
      ? esRecurrente
        ? "CERRADO"
        : "INICIADO"
      : estado.toUpperCase();

  return (
    <View style={[styles.badge, { backgroundColor: map[estado] || colors.border }]}>
      <Text style={styles.badgeTxt}>{label}</Text>
    </View>
  );
}

function RecurrentBadge({ colors }: { colors: ColorPalette }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: "#455a64", marginLeft: 6 },
      ]}
    >
      <Text style={styles.badgeTxt}>RECURRENTE</Text>
    </View>
  );
}

/* =========================================================
   Fila animada de grupo (Reanimated)
   ========================================================= */

type GroupRowProps = {
  item: Grupo;
  index: number;
  colors: ColorPalette;
  userId?: number;
  joiningId: number | null;
  leavingId: number | null;
  hasJoinedAny: boolean;
  currency: Intl.NumberFormat;
  getCuposDisp: (g: Grupo) => number;
  onJoin: (id: number) => void;
  confirmLeave: (g: Grupo) => void;
  navigation: Nav;
};

function GroupCardRow({
  item,
  index,
  colors,
  userId,
  joiningId,
  leavingId,
  hasJoinedAny,
  currency,
  getCuposDisp,
  onJoin,
  confirmLeave,
  navigation,
}: GroupRowProps) {
  const cuposTotales = Number(item.capacidad_total ?? item.cupos_totales ?? 0);
  const cuposDisp = getCuposDisp(item);

  const isOwner = Number(userId) === Number(item.conductor_id);
  const isMemberHere = Boolean(item.es_miembro);
  const isOpen = item.estado === "abierto";
  const esRecurrente = Boolean(item.es_recurrente);

  const precio =
    item.precio_base != null
      ? Number(item.precio_base)
      : item.costo_estimado != null
      ? Number(item.costo_estimado)
      : null;

  const isJoining = joiningId === item.id_grupo;
  const isLeaving = leavingId === item.id_grupo;

  const puedeSalir = isMemberHere && !isOwner && isOpen;

  let primaryLabel = "Unirse";
  let primaryDisabled = false;
  let primaryAction = () => {
    onJoin(item.id_grupo);
  };
  let primaryBg = colors.primary;

  if (isOwner) {
    primaryLabel = "Tu grupo";
    primaryDisabled = true;
    primaryAction = () => {};
    primaryBg = "#9e9e9e";
  } else if (isMemberHere) {
    if (!puedeSalir) {
      primaryLabel = "En curso";
      primaryDisabled = true;
      primaryAction = () => {};
      primaryBg = "#9e9e9e";
    } else {
      primaryLabel = isLeaving ? "Saliendo..." : "Salir";
      primaryDisabled = isLeaving;
      primaryAction = () => confirmLeave(item);
      primaryBg = "#c62828";
    }
  } else if (!isOpen) {
    primaryLabel = "No disponible";
    primaryDisabled = true;
    primaryBg = "#9e9e9e";
  } else if (cuposDisp <= 0) {
    primaryLabel = "Sin cupos";
    primaryDisabled = true;
    primaryBg = "#9e9e9e";
  } else if (hasJoinedAny) {
    primaryLabel = "Unido en otro";
    primaryDisabled = true;
    primaryBg = "#9e9e9e";
  } else if (esRecurrente && !isMemberHere) {
    primaryLabel = "Solo designados";
    primaryDisabled = true;
    primaryBg = "#9e9e9e";
  } else if (isJoining) {
    primaryLabel = "Uniendo...";
    primaryDisabled = true;
  }

  const canSeeDetail = isOwner || isMemberHere;

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 40)
        .duration(260)
        .easing(Easing.out(Easing.cubic))}
      layout={Layout.springify().damping(14).stiffness(120)}
      style={{ marginBottom: 12 }}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {item.conductor?.nombre} {item.conductor?.apellido}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <EstadoBadge
              estado={item.estado}
              esRecurrente={esRecurrente}
              colors={colors}
            />
            {esRecurrente && <RecurrentBadge colors={colors} />}
          </View>
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
        {precio !== null && Number.isFinite(precio) && (
          <Text style={{ color: colors.text, marginBottom: 4 }}>
            <Text style={styles.label}>Estimado: </Text>
            {currency.format(precio)}
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
            onPress={primaryAction}
            style={[styles.joinBtn, { backgroundColor: primaryBg }]}
            disabled={primaryDisabled}
          >
            {isJoining || (isMemberHere && isLeaving) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>{primaryLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              canSeeDetail &&
              navigation.navigate("GroupDetail", {
                grupoId: item.id_grupo,
              })
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
              style={[
                styles.detailTxt,
                { color: canSeeDetail ? colors.primary : "#aaa" },
              ]}
            >
              Ver detalle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* =========================================================
   Pantalla principal
   ========================================================= */

export default function PassengerScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const colors: ColorPalette =
    theme === "light" ? (lightColors as any) : (darkColors as any);
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);

  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [cupoFilter, setCupoFilter] = useState<CupoFilter>("cualquiera");
  const [fechaFilter, setFechaFilter] = useState<FechaFilter>("todos");
  const [precioFilter, setPrecioFilter] = useState<PrecioFilter>("cualquiera");

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Header animado con Reanimated
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-10);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.quad),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.quad),
    });
  }, [headerOpacity, headerTranslateY]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listGroups(
        user?.id ? { user_id: Number(user.id) } : undefined
      );
      setGrupos(data);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudieron cargar los grupos"
      );
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

      // actualización optimista
      setGrupos((prev) =>
        prev.map((g) =>
          g.id_grupo !== id
            ? g
            : {
                ...g,
                es_miembro: true,
                cupos_usados:
                  g.cupos_usados != null
                    ? Number(g.cupos_usados) + 1
                    : (g.cupos_usados as any),
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
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No fue posible unirte"
      );
      fetchData();
    } finally {
      setJoiningId(null);
    }
  };

  const onLeave = async (id: number) => {
    try {
      if (!user?.id) return Alert.alert("Sesión", "Inicia sesión.");
      if (leavingId) return;
      setLeavingId(id);

      await leaveGroup(id, { id_usuario: Number(user.id) });

      Alert.alert("Listo", "Saliste del grupo.");
      fetchData();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudo salir del grupo"
      );
    } finally {
      setLeavingId(null);
    }
  };

  const confirmLeave = (g: Grupo) => {
    Alert.alert("Salir del grupo", "¿Deseas abandonar este grupo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => onLeave(g.id_grupo),
      },
    ]);
  };

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
      }),
    []
  );

  const hasJoinedAny = useMemo(
    () => grupos.some((g) => g.es_miembro),
    [grupos]
  );

  const getCuposDisp = (g: Grupo) => {
    const total = Number(g.capacidad_total ?? g.cupos_totales ?? 0);
    const usados = Number(g.cupos_usados ?? 0);
    return Math.max(0, total - usados);
  };

  const isInFechaFilter = (
    dateISO?: string | null,
    f: FechaFilter = "todos"
  ) => {
    if (!dateISO || f === "todos") return true;
    const now = new Date();
    const d = new Date(dateISO);

    switch (f) {
      case "hoy": {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return d >= start && d < end;
      }
      case "24h": {
        const end = new Date(
          now.getTime() + 24 * 60 * 60 * 1000
        );
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

  const isInPrecioFilter = (
    costo?: number | null,
    f: PrecioFilter = "cualquiera"
  ) => {
    if (costo == null || Number.isNaN(costo) || f === "cualquiera")
      return true;
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
    return fields.some((x) =>
      (x ?? "").toString().toLowerCase().includes(needle)
    );
  };

  const gruposFiltrados = useMemo(() => {
    return grupos.filter((g) => {
      const okEstado =
        estadoFilter === "todos" ? true : g.estado === estadoFilter;
      if (!okEstado) return false;

      const disp = getCuposDisp(g);
      if (cupoFilter === "con" && disp <= 0) return false;
      if (cupoFilter === "sin" && disp > 0) return false;

      const okFecha = isInFechaFilter(
        g.fecha_salida ?? null,
        fechaFilter
      );
      if (!okFecha) return false;

      const precio =
        g.precio_base != null
          ? Number(g.precio_base)
          : g.costo_estimado != null
          ? Number(g.costo_estimado)
          : undefined;
      const okPrecio = isInPrecioFilter(precio, precioFilter);
      if (!okPrecio) return false;

      if (!matchesSearch(g, searchQuery)) return false;

      return true;
    });
  }, [
    grupos,
    estadoFilter,
    cupoFilter,
    fechaFilter,
    precioFilter,
    searchQuery,
  ]);

  const RotatingPill = ({
    label,
    valueLabel,
    onPress,
  }: {
    label: string;
    valueLabel: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, { borderColor: colors.primary }]}
    >
      <Text style={[styles.pillText, { color: colors.text }]}>
        {label}:{" "}
        <Text style={{ color: colors.primary }}>{valueLabel}</Text>
      </Text>
    </TouchableOpacity>
  );

  const cycleEstado = () => {
    const idx = ESTADO_OPTIONS.findIndex(
      (o) => o.value === estadoFilter
    );
    setEstadoFilter(
      ESTADO_OPTIONS[(idx + 1) % ESTADO_OPTIONS.length].value
    );
  };
  const cycleCupo = () => {
    const idx = CUPO_OPTIONS.findIndex((o) => o.value === cupoFilter);
    setCupoFilter(
      CUPO_OPTIONS[(idx + 1) % CUPO_OPTIONS.length].value
    );
  };
  const cycleFecha = () => {
    const idx = FECHA_OPTIONS.findIndex(
      (o) => o.value === fechaFilter
    );
    setFechaFilter(
      FECHA_OPTIONS[(idx + 1) % FECHA_OPTIONS.length].value
    );
  };
  const cyclePrecio = () => {
    const idx = PRECIO_OPTIONS.findIndex(
      (o) => o.value === precioFilter
    );
    setPrecioFilter(
      PRECIO_OPTIONS[(idx + 1) % PRECIO_OPTIONS.length].value
    );
  };

  const toggleSearch = () => {
    if (searchActive) {
      if (searchQuery.length > 0) setSearchQuery("");
      else setSearchActive(false);
    } else {
      setSearchActive(true);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header animado */}
      <Animated.View style={[styles.headerWrapper, headerAnimatedStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Grupos
        </Text>
      </Animated.View>

      {/* Filtros */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={toggleSearch}
          style={[styles.roundBtn, { backgroundColor: "#fff" }]}
          accessibilityLabel={
            searchActive || searchQuery
              ? "Cerrar búsqueda"
              : "Buscar grupos"
          }
        >
          <Ionicons
            name={
              searchActive || searchQuery
                ? "close-outline"
                : "search-outline"
            }
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>

        <RotatingPill
          label="Estado"
          valueLabel={
            ESTADO_OPTIONS.find((o) => o.value === estadoFilter)
              ?.label ?? "Todos"
          }
          onPress={cycleEstado}
        />

        <RotatingPill
          label="Fecha"
          valueLabel={
            FECHA_OPTIONS.find((o) => o.value === fechaFilter)
              ?.label ?? "Todos"
          }
          onPress={cycleFecha}
        />

        <RotatingPill
          label="Cupos"
          valueLabel={
            CUPO_OPTIONS.find((o) => o.value === cupoFilter)?.label ??
            "Cualquiera"
          }
          onPress={cycleCupo}
        />

        <RotatingPill
          label="Precio"
          valueLabel={
            PRECIO_OPTIONS.find((o) => o.value === precioFilter)
              ?.label ?? "Cualquiera"
          }
          onPress={cyclePrecio}
        />

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
          <Ionicons
            name="refresh-outline"
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      {searchActive && (
        <View
          style={[
            styles.searchBar,
            {
              borderColor: colors.primary,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por destino, origen o conductor"
            placeholderTextColor={colors.muted || "#888"}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.searchClear}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 30 }}
        />
      ) : gruposFiltrados.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title={
            grupos.length === 0
              ? "No hay grupos disponibles"
              : "Sin resultados"
          }
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
          renderItem={({ item, index }) => (
            <GroupCardRow
              item={item}
              index={index}
              colors={colors}
              userId={user?.id ? Number(user.id) : undefined}
              joiningId={joiningId}
              leavingId={leavingId}
              hasJoinedAny={hasJoinedAny}
              currency={currency}
              getCuposDisp={getCuposDisp}
              onJoin={onJoin}
              confirmLeave={confirmLeave}
              navigation={navigation}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
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
