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

// ⬇️ NUEVO: haptics opcional (no rompe si no está instalado)
let Haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require("expo-haptics");
} catch {}

type Props = {
  id: string;
  icon: string;
  label?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;

  // ⬇️ NUEVO — todas OPCIONALES y con defaults
  requireLongPress?: boolean;
  longPressDelayMs?: number;
  cooldownMs?: number;
  enableHaptics?: boolean;
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

  // ⬇️ NUEVO — defaults que no cambian el comportamiento actual
  requireLongPress = false,
  longPressDelayMs = 600,
  cooldownMs = 0,
  enableHaptics = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { user } = useUser();

  const [extended, setExtended] = useState<boolean | null>(null);
  const [disabledUntil, setDisabledUntil] = useState<number>(0); // ⬅️ NUEVO
  const isCoolingDown = disabledUntil > Date.now();              // ⬅️ NUEVO

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

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  // ⬇️ NUEVO: dispara acción con haptics y cooldown
  const trigger = async () => {
    if (isCoolingDown) return;

    if (enableHaptics && Haptics?.impactAsync) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }

    if (cooldownMs > 0) {
      setDisabledUntil(Date.now() + cooldownMs);
    }

    onPress();
  };

  const handlePressIn = () => {
    if (isCoolingDown) return;
    animateIn();
  };

  const handlePressOut = async () => {
    animateOut();

    if (extended && user?.id) {
      try {
        await AsyncStorage.setItem(`fabSeen_${id}_${user.id}`, "true");
        setExtended(false);
      } catch (e) {
        console.error("Error guardando preferencia FAB", e);
      }
    }

    // ⚠️ Retro-compat: si NO requiere long-press, dispara en pressOut (como antes)
    if (!requireLongPress && !isCoolingDown) {
      trigger();
    }
  };

  if (extended === null) return null;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={requireLongPress ? trigger : undefined}           // ⬅️ NUEVO
      delayLongPress={requireLongPress ? longPressDelayMs : undefined} // ⬅️ NUEVO
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint || "Activa esta acción rápida"}
      accessibilityState={{ disabled: isCoolingDown }}               // ⬅️ NUEVO
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      disabled={isCoolingDown}                                       // ⬅️ NUEVO
    >
      <Animated.View
        style={[
          styles.fab,
          extended && styles.extendedFab,
          { backgroundColor, transform: [{ scale }] },
          style,
          isCoolingDown && { opacity: 0.7 },                         // ⬅️ feedback visual
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
