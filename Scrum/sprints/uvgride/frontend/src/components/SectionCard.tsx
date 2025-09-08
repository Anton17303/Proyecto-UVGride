import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type Props = {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
};

export default function SectionCard({ title, children, style }: Props) {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    marginHorizontal: 16,
    // sombras más sutiles (en dark evitan look “polvoso”)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    opacity: 0.7,
  },
});
