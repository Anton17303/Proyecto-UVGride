// src/screens/AchievementsScreen.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useAchievements } from "../achievements/AchievementsContext";
import { EmptyState, BackButton } from "../components";

type FilterKey = "all" | "in_progress" | "completed" | "locked";

const ESTADO_OPTIONS: { label: string; value: FilterKey }[] = [
  { label: "Todos", value: "all" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completados", value: "completed" },
  { label: "Bloqueados", value: "locked" },
];

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const mutedText = colors.muted ?? (theme === "dark" ? "#A6A6A6" : "#6B7280");

  const { catalog, getStatus } = useAchievements();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSearch = useCallback(() => {
    if (searchActive) {
      if (searchQuery.length > 0) setSearchQuery("");
      else setSearchActive(false);
    } else {
      setSearchActive(true);
    }
  }, [searchActive, searchQuery]);

  const cycleEstado = () => {
    const idx = ESTADO_OPTIONS.findIndex((o) => o.value === filter);
    setFilter(ESTADO_OPTIONS[(idx + 1) % ESTADO_OPTIONS.length].value);
  };

  const items = useMemo(() => {
    const base = catalog.map((def) => {
      const s = getStatus(def.id);
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        category: def.category ?? "General",
        icon: def.icon ?? "trophy-outline",
        status: s.status as "completed" | "in_progress" | "locked",
        progress: s.progress,
        goal: s.goal,
        awardedAt: s.awardedAt,
      };
    });

    const filtered =
      filter === "all" ? base : base.filter((i) => i.status === filter);

    const searched = filtered.filter((i) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });

    // Orden: En progreso -> Completados -> Bloqueados; dentro, mayor % primero
    const score = (st: typeof searched[number]["status"]) =>
      st === "in_progress" ? 0 : st === "completed" ? 1 : 2;

    return searched.sort((a, b) => {
      const sdiff = score(a.status) - score(b.status);
      if (sdiff !== 0) return sdiff;
      const ap = Math.min(a.progress / Math.max(a.goal, 1), 1);
      const bp = Math.min(b.progress / Math.max(b.goal, 1), 1);
      return bp - ap;
    });
  }, [catalog, getStatus, filter, searchQuery]);

  const totals = useMemo(() => {
    const all = catalog.length;
    let completed = 0;
    for (const def of catalog) if (getStatus(def.id).status === "completed") completed++;
    return { all, completed };
  }, [catalog, getStatus]);

  const renderItem = ({
    item,
  }: {
    item: {
      id: string;
      title: string;
      description: string;
      category: string;
      icon: string;
      status: "completed" | "in_progress" | "locked";
      progress: number;
      goal: number;
      awardedAt?: number;
    };
  }) => {
    const pct = Math.min(item.progress / Math.max(item.goal, 1), 1);
    const pctLabel = `${Math.round(pct * 100)}%`;
    const statusColor =
      item.status === "completed"
        ? "#12B886"
        : item.status === "in_progress"
        ? "#F59F00"
        : mutedText;

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeTxt}>
              {item.status === "completed"
                ? "COMPLETADO"
                : item.status === "in_progress"
                ? "EN PROGRESO"
                : "BLOQUEADO"}
            </Text>
          </View>
        </View>

        {/* Sub */}
        <Text style={{ color: colors.text, marginBottom: 2 }} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={{ color: mutedText, marginBottom: 8 }}>{item.category}</Text>

        {/* Barra de progreso */}
        <View
          style={[
            styles.track,
            { backgroundColor: theme === "dark" ? "#2A2A2A" : "#EAEAEA" },
          ]}
        >
          <View
            style={[
              styles.fill,
              { width: `${pct * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name={item.status === "completed" ? "trophy" : "trophy-outline"}
              size={16}
              color={statusColor}
            />
            <Text style={{ color: mutedText, fontWeight: "700", fontSize: 12 }}>
              {pctLabel}
            </Text>
          </View>
          <Text style={{ color: mutedText, fontWeight: "700", fontSize: 12 }}>
            {item.progress}/{item.goal}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      {/* Título */}
      <Text style={[styles.title, { color: colors.text }]}>Logros</Text>

      {/* Toolbar (estilo estándar) */}
      <View style={styles.toolbar}>
        {/* 1) Búsqueda */}
        <TouchableOpacity
          onPress={toggleSearch}
          style={[styles.roundBtn, { backgroundColor: "#fff", borderColor: colors.primary }]}
          accessibilityLabel={searchActive || searchQuery ? "Cerrar búsqueda" : "Buscar logros"}
        >
          <Ionicons
            name={searchActive || searchQuery ? "close-outline" : "search-outline"}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* 2) Estado */}
        <TouchableOpacity
          onPress={cycleEstado}
          style={[styles.pill, { borderColor: colors.primary }]}
        >
          <Text style={[styles.pillText, { color: colors.text }]}>
            Estado:{" "}
            <Text style={{ color: colors.primary }}>
              {ESTADO_OPTIONS.find((o) => o.value === filter)?.label ?? "Todos"}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* 3) Reset */}
        <TouchableOpacity
          onPress={() => {
            setFilter("all");
            setSearchQuery("");
            setSearchActive(false);
          }}
          style={[styles.roundBtn, { backgroundColor: "#fff", borderColor: colors.primary }]}
          accessibilityLabel="Restablecer filtros"
        >
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      {searchActive && (
        <View
          style={[
            styles.searchBar,
            { borderColor: colors.primary, backgroundColor: colors.card },
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
            placeholder="Buscar por título o categoría"
            placeholderTextColor={mutedText}
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

      {/* Resumen */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: mutedText, fontSize: 12, fontWeight: "700" }}>
          Completados {totals.completed} de {totals.all}
        </Text>
      </View>

      {/* Lista */}
      {items.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="Sin resultados"
          subtitle="No hay logros que coincidan con el filtro actual."
          color={colors.primary}
          textColor={colors.text}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
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

  // Toolbar estándar (como PassengerScreen)
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

  // Search bar estándar
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
  searchClear: { paddingLeft: 6 },

  // Card estándar (como PassengerScreen)
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

  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
