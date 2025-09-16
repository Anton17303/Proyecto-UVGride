import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  Text,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";

type Props = {
  id: string;                 // ✅ identificador único del FAB
  icon: string;
  label?: string;             // Texto opcional
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export default function FloatingActionButton({
  id,
  icon,
  label = "Acción",
  size = 24,
  color = "#fff",
  backgroundColor = "#4CAF50",
  onPress,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { user } = useUser();

  const [extended, setExtended] = useState(true);

  // 🚀 Cargar preferencia por usuario y FAB
  useEffect(() => {
    const loadFabPref = async () => {
      if (!user?.id) return;
      try {
        const seen = await AsyncStorage.getItem(`fabSeen_${id}_${user.id}`);
        if (seen === "true") setExtended(false);
      } catch (e) {
        console.error("Error cargando preferencia FAB", e);
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

    // ✅ Guardar que ya se mostró extendido al menos una vez
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

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  extendedFab: {
    width: "auto",
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  label: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
  },
});
