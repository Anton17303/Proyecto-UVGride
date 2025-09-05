// components/LinkText.tsx
import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  text: string;
  onPress: () => void;
  color?: string;
};

export default function LinkText({ text, onPress, color = "#4F46E5" }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.link, { color }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    textDecorationLine: "underline",
  },
});
