import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  style?: ViewStyle;
  buttonColor?: string; // ✅ color para ícono y borde
  backgroundColor?: string; // ✅ color para la card
};

function ZoomButton({
  icon,
  onPress,
  color = "#000",
}: {
  icon: string;
  onPress: () => void;
  color?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
    onPress();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.smallFab, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={22} color={color} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  style,
  buttonColor = "#000",
  backgroundColor = "#fff",
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      <ZoomButton icon="add" onPress={onZoomIn} color={buttonColor} />
      <ZoomButton icon="remove" onPress={onZoomOut} color={buttonColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "column",
    gap: 10,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  smallFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
