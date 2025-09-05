// components/AnimatedInput.tsx
import React, { useRef } from "react";
import { TextInput, StyleSheet, Animated } from "react-native";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  color?: string;
  borderColor?: string;
  textColor?: string;
};

export default function AnimatedInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  color = "#4F46E5",
  borderColor = "#ccc",
  textColor = "#000",
}: Props) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const animateBorder = (toValue: number) => {
    Animated.timing(borderAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [borderColor, color],
          }),
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#888"
        secureTextEntry={secureTextEntry}
        onFocus={() => animateBorder(1)}
        onBlur={() => animateBorder(0)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
  },
});
