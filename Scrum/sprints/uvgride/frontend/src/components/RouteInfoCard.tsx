import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ViewStyle, Animated } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  durationSec: number;
  distanceKm: number;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: ViewStyle;
};

export default function RouteInfoCard({
  durationSec,
  distanceKm,
  textColor = "#000",
  backgroundColor = "#fff",
  borderColor = "#ddd",
  style,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    Animated.spring(translateY, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor, borderColor, opacity: fadeAnim, transform: [{ translateY }] },
        style,
      ]}
    >
      <Ionicons
        name="time-outline"
        size={18}
        color={textColor}
        style={{ marginRight: 6 }}
      />
      <Text
        style={[styles.text, { color: textColor }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {formatDuration(durationSec)} · {distanceKm.toFixed(1)} km
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
