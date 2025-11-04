// src/components/StreakCard.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  current: number;
  best: number;
  color: string;                // colors.primary
  textColor?: string;           // si no envías, se decide según el modo
  mode?: "outline" | "solid";   // "outline" = más sutil (default), "solid" = fondo primario
  onPress?: () => void;         // opcional (por si quieres abrir Achievements)
};

export default function StreakCard({
  current,
  best,
  color,
  textColor,
  mode = "outline",
  onPress,
}: Props) {
  const computedTextColor = textColor ?? (mode === "solid" ? "#fff" : "#333");

  const label =
    current > 0 ? `${current} ${current === 1 ? "día" : "días"}` : "Sin racha";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={[
        styles.chip,
        mode === "solid"
          ? { backgroundColor: color }
          : { backgroundColor: "transparent", borderColor: color, borderWidth: 1 },
      ]}
    >
      <Text
        style={[
          styles.flame,
          { color: mode === "solid" ? computedTextColor : color },
        ]}
      >
        🔥
      </Text>

      <Text style={[styles.text, { color: computedTextColor }]} numberOfLines={1}>
        {label}
        <Text style={{ opacity: 0.6 }}>{` · Mejor `}</Text>
        {best}
      </Text>

      <View style={styles.trophyWrap}>
        <Ionicons
          name="trophy"
          size={14}
          color={mode === "solid" ? computedTextColor : color}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    // sutil: sin sombra
    marginBottom: 8,
  },
  flame: { fontSize: 14 },
  text: { fontSize: 13, fontWeight: "800" },
  trophyWrap: { marginLeft: 4 },
});
