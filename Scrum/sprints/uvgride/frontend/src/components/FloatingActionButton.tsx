import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  Text,
  AccessibilityProps,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";

type Props = {
  id: string;
  icon: string;
  label?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
} & AccessibilityProps;

export default function FloatingActionButton({
  id,
  icon,
  label = "Acción",
  size = 24,
  color = "#fff",
  backgroundColor = "#4CAF50",
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { user } = useUser();

  const [extended, setExtended] = useState<boolean | null>(null);

  // 🚀 Cargar preferencia por usuario y FAB
  useEffect(() => {
    const loadFabPref = async () => {
      if (!user?.id) return;
      try {
        const seen = await AsyncStorage.getItem(`fabSeen_${id}_${user.id}`);
        setExtended(seen !== "true");
      } catch (e) {
        console.error("Error cargando preferencia FAB", e);
        setExtended(true);
      }
    };
    loadFabPref();
  }, [user?.id, id]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = async () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

    if (extended && user?.id) {
      try {
        await AsyncStorage.setItem(`fabSeen_${id}_${user.id}`, "true");
        setExtended(false);
      } catch (e) {
        console.error("Error guardando preferencia FAB", e);
      }
    }

    onPress();
  };

  if (extended === null) return null;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint || "Activa esta acción rápida"}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View
        style={[
          styles.fab,
          extended && styles.extendedFab,
          { backgroundColor, transform: [{ scale }] },
          style,
        ]}
      >
        <Ionicons name={icon} size={size} color={color} />
        {extended && label && (
          <Text style={[styles.label, { color }]}>{label}</Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: "row",
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    paddingHorizontal: 16,
  },
  extendedFab: {
    paddingHorizontal: 20,
  },
  label: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
  },
});
