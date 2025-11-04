// src/screens/AchievementsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useAchievements } from "../achievements/AchievementsContext";

type FilterKey = "all" | "in_progress" | "completed" | "locked";

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const { catalog, getStatus } = useAchievements();

  const colors = theme === "light" ? lightColors : darkColors;
  const mutedText = theme === "dark" ? "#A6A6A6" : "#6B7280";
  const cardBg = theme === "dark" ? "#141414" : "#FFFFFF";
  const border = theme === "dark" ? "#262626" : "#ECECEC";
  const trackColor = theme === "dark" ? "#1F1F1F" : "#EAEAEA";
  const fillColor = theme === "dark" ? "#7C5CFF" : "#4F6BFF";

  const [filter, setFilter] = useState<FilterKey>("all");

  const data = useMemo(() => {
    const items = catalog.map((def) => {
      const s = getStatus(def.id);
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        status: s.status, // "completed" | "in_progress" | "locked"
        progress: s.progress,
        goal: s.goal,
        icon: def.icon ?? "trophy-outline",
        category: def.category ?? "General",
        awardedAt: s.awardedAt,
      };
    });

    const orderScore = (st: typeof items[number]["status"]) =>
      st === "in_progress" ? 0 : st === "completed" ? 1 : 2;

    const filtered =
      filter === "all" ? items : items.filter((it) => it.status === filter);

    return filtered.sort((a, b) => {
      const byStatus = orderScore(a.status) - orderScore(b.status);
      if (byStatus !== 0) return byStatus;
      // luego por progreso descendente
      const ap = Math.min(a.progress / Math.max(a.goal, 1), 1);
      const bp = Math.min(b.progress / Math.max(b.goal, 1), 1);
      return bp - ap;
    });
  }, [catalog, getStatus, filter]);

  const totals = useMemo(() => {
    const all = catalog.length;
    let completed = 0;
    for (const def of catalog) {
      const s = getStatus(def.id);
      if (s.status === "completed") completed++;
    }
    return { all, completed };
  }, [catalog, getStatus]);

  const renderItem = ({
    item,
  }: {
    item: {
      id: string;
      title: string;
      description: string;
      status: "completed" | "in_progress" | "locked";
      progress: number;
      goal: number;
      icon: string;
      category: string;
      awardedAt?: number;
    };
  }) => {
    const pct = Math.min(item.progress / Math.max(item.goal, 1), 1);
    const statusColor =
      item.status === "completed" ? "#12B886" : item.status === "in_progress" ? "#F59F00" : mutedText;

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={item.status === "completed" ? "trophy" : "trophy-outline"}
              size={22}
              color={statusColor}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.subtitle, { color: mutedText }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>

          <Text style={[styles.badge, { color: statusColor, borderColor: statusColor }]}>
            {item.status === "completed"
              ? "Completado"
              : item.status === "in_progress"
              ? "En progreso"
              : "Bloqueado"}
          </Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct * 100}%`, backgroundColor: fillColor },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.progressText, { color: mutedText }]}>{item.category}</Text>
          <Text style={[styles.progressText, { color: mutedText }]}>
            {Math.round(pct * 100)}% • {item.progress}/{item.goal}
          </Text>
        </View>
      </View>
    );
  };

  const FilterButton = ({
    k,
    label,
    icon,
  }: {
    k: FilterKey;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }) => {
    const active = filter === k;
    return (
      <Pressable
        onPress={() => setFilter(k)}
        style={[
          styles.chip,
          {
            backgroundColor: active ? (theme === "dark" ? "#1E293B" : "#EEF2FF") : "transparent",
            borderColor: active ? (theme === "dark" ? "#334155" : "#C7D2FE") : border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={14}
          color={active ? (theme === "dark" ? "#93C5FD" : "#4F46E5") : mutedText}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            color: active ? (theme === "dark" ? "#BFDBFE" : "#4338CA") : mutedText,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Logros</Text>
        <Text style={[styles.screenSubtitle, { color: mutedText }]}>
          Completados {totals.completed} de {totals.all}
        </Text>
      </View>

      {/* Filtros */}
      <View style={[styles.filtersRow, { borderColor: border }]}>
        <FilterButton k="all" label="Todos" icon="layers-outline" />
        <FilterButton k="in_progress" label="En progreso" icon="play-circle-outline" />
        <FilterButton k="completed" label="Completados" icon="checkmark-done-outline" />
        <FilterButton k="locked" label="Bloqueados" icon="lock-closed-outline" />
      </View>

      {/* Lista */}
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={28} color={mutedText} />
            <Text style={[styles.emptyText, { color: mutedText }]}>
              Aún no hay logros en esta categoría.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 18,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
  },
});
