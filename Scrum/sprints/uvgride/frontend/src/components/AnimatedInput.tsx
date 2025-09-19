// components/AnimatedInput.tsx
import React, { useRef } from "react";
import { TextInput, StyleSheet, Animated, Text } from "react-native";

type Variant = "text" | "email" | "password" | "short" | "long";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: Variant;
  color?: string;
  borderColor?: string;
  textColor?: string;
  errorMessage?: string; // opcional
};

export default function AnimatedInput({
  placeholder,
  value,
  onChangeText,
  variant = "text",
  color = "#4F46E5",
  borderColor = "#ccc",
  textColor = "#000",
  errorMessage,
}: Props) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const animateBorder = (toValue: number) => {
    Animated.timing(borderAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Config según el tipo de input
  const getConfig = () => {
    switch (variant) {
      case "email":
        return {
          keyboardType: "email-address" as const,
          secureTextEntry: false,
          autoCapitalize: "none" as const,
          multiline: false,
          maxLength: 100,
        };
      case "password":
        return {
          keyboardType: "default" as const,
          secureTextEntry: true,
          autoCapitalize: "none" as const,
          multiline: false,
          maxLength: 50,
        };
      case "short":
        return {
          keyboardType: "default" as const,
          secureTextEntry: false,
          autoCapitalize: "sentences" as const,
          multiline: false,
          maxLength: 50,
        };
      case "long":
        return {
          keyboardType: "default" as const,
          secureTextEntry: false,
          autoCapitalize: "sentences" as const,
          multiline: true,
          maxLength: 500,
        };
      default:
        return {
          keyboardType: "default" as const,
          secureTextEntry: false,
          autoCapitalize: "sentences" as const,
          multiline: false,
          maxLength: 200,
        };
    }
  };

  const config = getConfig();

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
        style={[
          styles.input,
          { color: textColor, height: config.multiline ? 100 : undefined },
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#888"
        secureTextEntry={config.secureTextEntry}
        keyboardType={config.keyboardType}
        autoCapitalize={config.autoCapitalize}
        multiline={config.multiline}
        maxLength={config.maxLength}
        onFocus={() => animateBorder(1)}
        onBlur={() => animateBorder(0)}
      />
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
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
    textAlignVertical: "top", // importante para multiline
  },
  error: {
    marginTop: 4,
    color: "#d9534f",
    fontSize: 13,
    fontWeight: "500",
  },
});
