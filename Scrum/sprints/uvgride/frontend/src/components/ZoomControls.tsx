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
};

function ZoomButton({
  icon,
  onPress,
}: {
  icon: string;
  onPress: () => void;
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
        <Ionicons name={icon} size={22} color="#000" />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function ZoomControls({ onZoomIn, onZoomOut, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <ZoomButton icon="add" onPress={onZoomIn} />
      <ZoomButton icon="remove" onPress={onZoomOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  smallFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#fff",
    elevation: 3, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
});
