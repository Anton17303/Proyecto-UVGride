import React, { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle, Platform } from "react-native";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

type BackButtonProps = {
  label?: string;      // solo para accesibilidad
  style?: ViewStyle;   // estilo extra para el contenedor externo
  onPress?: () => void;
};

const ICON_SIZE = 20;
const BTN_SIZE = 36;   // tamaño cómodo para móvil

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
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          !enabled && styles.disabled,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={enabled ? "Vuelve a la pantalla anterior" : "No hay una pantalla previa"}
        accessibilityState={{ disabled: !enabled }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={!enabled}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={ICON_SIZE} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // contenedor pensado para ir arriba a la izquierda
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 8,
    marginBottom: 4,
  },
  button: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",

    // Sombra suave para móvil
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabled: {
    opacity: 0.4,
  },
});
