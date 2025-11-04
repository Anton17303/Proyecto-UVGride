import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useAchievements } from "../achievements/AchievementsContext";

type Props = {
  visible: boolean;
  achievementId?: string;
  onClose: () => void;
};

export default function AchievementUnlockModal({ visible, achievementId, onClose }: Props) {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const { catalog, getStatus } = useAchievements();

  const def = catalog.find((d) => d.id === achievementId);
  const st = achievementId ? getStatus(achievementId) : undefined;

  if (!def || !st) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, { backgroundColor: colors.card || "#101010" }]}>
        <Ionicons name="trophy" size={36} color="#12B886" />
        <Text style={[styles.title, { color: colors.text }]}>¡Logro desbloqueado!</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>{def.title}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary || "#999" }]}>{def.description}</Text>

        <Pressable style={[styles.btn]} onPress={onClose}>
          <Text style={styles.btnText}>Continuar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 14, fontWeight: "700" },
  desc: { marginTop: 4, fontSize: 13, textAlign: "center" },
  btn: {
    marginTop: 14,
    backgroundColor: "#12B886",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  btnText: { color: "white", fontWeight: "800" },
});
