import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type BackButtonProps = {
  label?: string;
  style?: ViewStyle;
  onPress?: () => void;
};

const ICON_SIZE = 22;

export default function BackButton({ label = "Regresar", style, onPress }: BackButtonProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { theme } = useTheme();

  const colors = useMemo(() => (theme === "light" ? lightColors : darkColors), [theme]);
  const parent = navigation.getParent?.();
  const canGoBack = navigation.canGoBack() || Boolean(parent?.canGoBack?.());
  const enabled = Boolean(onPress) || canGoBack;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const parentNav = navigation.getParent?.();
    if (parentNav?.canGoBack()) {
      parentNav.goBack();
    }
  }, [navigation, onPress]);

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.card, borderColor: colors.border },
          !enabled && styles.disabled,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
        accessibilityHint={enabled ? "Vuelve a la pantalla anterior" : "No hay una pantalla previa"}
        accessibilityState={{ disabled: !enabled }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={!enabled}
      >
        <Ionicons name="chevron-back" size={ICON_SIZE} color={colors.primary} />
        <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});