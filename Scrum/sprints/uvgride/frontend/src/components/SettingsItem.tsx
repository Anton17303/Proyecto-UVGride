import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  icon: string;
  title: string;
  onPress: () => void;
  colors: any;
  danger?: boolean;
};

export default function SettingsItem({
  icon,
  title,
  onPress,
  colors,
  danger,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={danger ? "#d9534f" : colors.primary}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: danger ? "#d9534f" : colors.text },
        ]}
      >
        {title}
      </Text>
      <Ionicons
        name="chevron-forward-outline"
        size={18}
        color={danger ? "#d9534f" : "#999"}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // compacto
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
  },
  chevron: {
    marginLeft: "auto",
  },
});
