import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
};

export default function EmptyState({ icon, title, subtitle, color, textColor }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={60} color={color} style={{ marginBottom: 12 }} />
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 60, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: "center", opacity: 0.7 },
});
