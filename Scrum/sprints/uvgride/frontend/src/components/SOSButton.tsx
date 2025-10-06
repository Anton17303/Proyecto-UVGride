// src/components/SOSButton.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View, Animated, StyleSheet, ViewStyle } from "react-native";

type SOSState = "idle" | "arming" | "active" | "disabled";

type Props = {
  state?: SOSState;
  size?: number;            // diámetro en px (default 120)
  label?: string;           // texto cuando idle
  countdown?: number | null;// número a mostrar cuando "arming"
  style?: ViewStyle;        // estilos externos
  onPressIn?: () => void;   // opcional (solo UI, no implementa lógica)
  onPressOut?: () => void;  // opcional
  onLongPress?: () => void; // opcional
};

export const SOSButton: React.FC<Props> = ({
  state = "idle",
  size = 120,
  label = "SOS",
  countdown = null,
  style,
  onPressIn,
  onPressOut,
  onLongPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;           // anim de “press”
  const pulse = useRef(new Animated.Value(1)).current;           // anim de “latido”
  const ringOpacity = useRef(new Animated.Value(0.45)).current;  // halo

  // Animación de “latido” solo cuando está activo
  useEffect(() => {
    if (state === "active") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      // sutil variación de opacidad del halo
      const halo = Animated.loop(
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0.65, duration: 900, useNativeDriver: false }),
          Animated.timing(ringOpacity, { toValue: 0.45, duration: 900, useNativeDriver: false }),
        ])
      );
      halo.start();
      return () => {
        loop.stop();
        halo.stop();
      };
    } else {
      pulse.setValue(1);
      ringOpacity.setValue(0.45);
    }
  }, [state, pulse, ringOpacity]);

  const palette = useMemo(() => {
    // Colores por estado (solo UI)
    if (state === "disabled")
      return { base: "#BDBDBD", dark: "#9E9E9E", text: "#EEEEEE", ring: "#B0BEC5" };
    if (state === "active")
      return { base: "#D50000", dark: "#B00020", text: "#FFFFFF", ring: "#FF5252" };
    if (state === "arming")
      return { base: "#FF1744", dark: "#D50000", text: "#FFFFFF", ring: "#FF8A80" };
    return { base: "#FF1744", dark: "#FF5252", text: "#FFFFFF", ring: "#FFCDD2" };
  }, [state]);

  const diameter = size;
  const radius = diameter / 2;

  const displayText =
    state === "arming" && typeof countdown === "number" ? String(countdown) : label;

  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      {/* Halo/Anillo externo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: diameter * 1.5,
            height: diameter * 1.5,
            borderRadius: (diameter * 1.5) / 2,
            backgroundColor: palette.ring,
            opacity: ringOpacity,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      {/* Botón principal */}
      <Pressable
        disabled={state === "disabled"}
        onPressIn={() => {
          Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
          onPressIn?.();
        }}
        onPressOut={() => {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
          onPressOut?.();
        }}
        onLongPress={onLongPress}
        delayLongPress={600} // solo UI: sensación de “mantener presionado”
        style={({ pressed }) => [
          {
            width: diameter,
            height: diameter,
            borderRadius: radius,
            alignItems: "center",
            justifyContent: "center",
          },
          // Sombra
          {
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 12,
            elevation: 10,
          },
        ]}
      >
        {/* Capa animada para “press” */}
        <Animated.View
          style={{
            transform: [{ scale }],
            width: diameter,
            height: diameter,
            borderRadius: radius,
            backgroundColor: palette.base,
            borderWidth: 4,
            borderColor: palette.dark,
          }}
        >
          {/* Brillo superior (simple pseudo-gradiente) */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: diameter * 0.55,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          />
          {/* Etiqueta */}
          <View style={styles.center}>
            <Text
              style={[
                styles.label,
                {
                  color: palette.text,
                  fontSize: Math.max(18, diameter * 0.18),
                  letterSpacing: 1.2,
                },
              ]}
            >
              {displayText}
            </Text>
            {/* Subtítulo según estado (UI-only) */}
            <Text style={[styles.sub, { color: "rgba(255,255,255,0.85)" }]}>
              {state === "idle" && "Mantén presionado"}
              {state === "arming" && "Armado…"}
              {state === "active" && "SOS activo"}
              {state === "disabled" && "Bloqueado"}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
});
