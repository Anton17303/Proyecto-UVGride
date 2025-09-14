import React, { useRef } from "react";
import {
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  icon: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export default function FloatingActionButton({
  icon,
  size = 24,
  color = "#fff",
  backgroundColor = "#4CAF50",
  onPress,
  style,
}: Props) {
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
      <Animated.View
        style={[
          styles.fab,
          { backgroundColor, transform: [{ scale }] },
          style,
        ]}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fab: {
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
});
