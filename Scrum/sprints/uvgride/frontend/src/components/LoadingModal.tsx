import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";

type Props = {
  visible: boolean;
  message?: string;
  backgroundColor?: string;
  textColor?: string;
  spinnerColor?: string;
};

export default function LoadingModal({
  visible,
  message = "Cargando...",
  backgroundColor = "#fff",
  textColor = "#111",
  spinnerColor = "#4CAF50",
}: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.modal,
          { backgroundColor, transform: [{ scale }], opacity },
        ]}
      >
        <ActivityIndicator size="large" color={spinnerColor} />
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  text: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
