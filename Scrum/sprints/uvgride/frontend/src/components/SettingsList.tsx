import React from "react";
import { View, StyleSheet } from "react-native";
import SettingsItem from "./SettingsItem";

type Item = {
  title: string;
  icon: string;
  action: () => void;
  danger?: boolean;
  condition?: boolean;
};

type Props = {
  items: Item[];
  colors: any;
};

export default function SettingsList({ items, colors }: Props) {
  return (
    <View style={[styles.list, { backgroundColor: colors.card }]}>
      {items
        .filter((item) => item.condition === undefined || item.condition)
        .map((item, index) => (
          <SettingsItem
            key={index}
            icon={item.icon}
            title={item.title}
            onPress={item.action}
            danger={item.danger}
            colors={colors}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 16,
    overflow: "hidden",
  },
});
