// components/PrimaryButton.tsx
import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  color?: string;
};

export default function PrimaryButton({ title, onPress, loading, color = "#4F46E5" }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => animate(0.95)}
        onPressOut={() => animate(1)}
        onPress={onPress}
        style={[styles.button, { backgroundColor: color }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
