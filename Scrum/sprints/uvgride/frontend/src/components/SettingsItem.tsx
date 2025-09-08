import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type Props = {
  icon: string;
  label: string;
  onPress?: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
};

export default function SettingsItem({
  icon,
  label,
  onPress,
  hasSwitch,
  switchValue,
  onSwitchChange,
  danger,
}: Props) {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const iconColor = danger ? colors.notification : colors.primary;
  const textColor = danger ? colors.notification : colors.text;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={hasSwitch ? 1 : 0.7}
    >
      <Ionicons name={icon as any} size={20} color={iconColor} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>

      {hasSwitch ? (
        <Switch
          value={!!switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#ccc", true: colors.primary }}
          thumbColor={switchValue ? "#fff" : "#f4f3f4"}
          style={{ marginLeft: "auto" }}
        />
      ) : (
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={danger ? colors.notification : "#999"}
          style={{ marginLeft: "auto" }}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // compacto y agradable
    gap: 12,
  },
  text: {
    fontSize: 15,
    flexShrink: 1,
  },
});
