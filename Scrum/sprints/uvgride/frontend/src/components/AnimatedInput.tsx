// components/AnimatedInput.tsx
import React, {
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  TextInput,
  StyleSheet,
  Animated,
  Text,
  TextInputProps,
} from "react-native";

type Variant = "text" | "email" | "password" | "short" | "long" | "phone";

export type AnimatedInputRef = {
  validate: () => boolean;
  isValid: () => boolean;
};

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: Variant;
  color?: string;
  borderColor?: string;
  textColor?: string;
  errorMessage?: string;

  validateOnChange?: boolean;
  onValidityChange?: (valid: boolean) => void;

  allowedEmailDomains?: string[];
  allowOutlookCountryTLD?: boolean;
};

function InnerAnimatedInput(
  {
    placeholder,
    value,
    onChangeText,
    variant = "text",
    color = "#4F46E5",
    borderColor = "#ccc",
    textColor = "#000",
    errorMessage,
    validateOnChange = false,
    onValidityChange,
    allowedEmailDomains = ["gmail.com", "uvg.edu.gt", "outlook.com"],
    allowOutlookCountryTLD = true,
  }: Props,
  ref: React.Ref<AnimatedInputRef>
) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [lastValid, setLastValid] = useState<boolean>(true);

  const animateBorder = (toValue: number) => {
    Animated.timing(borderAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const onlyDigits = (s: string) => s.replace(/\D+/g, "");

  const formatGtPhone = (input: string) => {
    let digits = onlyDigits(input);
    let hasCC = false;
    if (digits.startsWith("502")) {
      hasCC = true;
      digits = digits.slice(3);
    }
    if (digits.length > 8) digits = digits.slice(0, 8);
    const first = digits.slice(0, 4);
    const last = digits.slice(4);
    const local = last ? `${first}-${last}` : first;
    return (hasCC ? "+502 " : "") + local;
  };

  const isValidGtPhone = (text: string) => {
    const digits = onlyDigits(text);
    if (digits.startsWith("502")) return digits.length === 11
    return digits.length === 8;
  };

  const isValidEmail = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    const atIdx = trimmed.lastIndexOf("@");
    if (atIdx <= 0 || atIdx === trimmed.length - 1) return false;

    const localPart = trimmed.slice(0, atIdx);
    const domain = trimmed.slice(atIdx + 1);

    if (!/^[^\s"@]+$/.test(localPart)) return false;

    if (allowedEmailDomains.includes(domain)) return true;

    if (allowOutlookCountryTLD && /^outlook\.[a-z]{2}$/.test(domain)) {
      return true;
    }
    return false;
  };

  const validate = (text: string) => {
    if (variant === "email") {
      return isValidEmail(text)
        ? undefined
        : "Usa un correo válido";
    }
    if (variant === "phone") {
      return isValidGtPhone(text)
        ? undefined
        : "Usa un número de teléfono valido";
    }
    if (variant === "password") {
      return text.length >= 6
        ? undefined
        : "La contraseña debe tener al menos 6 caracteres";
    }
    return undefined;
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const err = validate(value);
      setLocalError(err);
      const ok = !err;
      if (ok !== lastValid) {
        setLastValid(ok);
        onValidityChange?.(ok);
      }
      return ok;
    },
    isValid: () => lastValid,
  }));

  const config = useMemo(() => {
    switch (variant) {
      case "email":
        return {
          keyboardType: "email-address" as const,
          secureTextEntry: false,
          autoCapitalize: "none" as const,
          multiline: false,
          maxLength: 100,
          autoComplete: "email" as const,
          textContentType: "emailAddress" as const,
        };
      case "password":
        return {
          keyboardType: "default" as const,
          secureTextEntry: true,
          autoCapitalize: "none" as const,
          multiline: false,
          maxLength: 50,
          textContentType: "password" as const,
          autoComplete: "password" as const,
        };
      case "long":
        return {
          keyboardType: "default" as const,
          secureTextEntry: false,
          autoCapitalize: "sentences" as const,
          multiline: true,
          maxLength: 500,
        };
      case "short":
        return {
          keyboardType: "default" as const,
          secureTextEntry: false,
          autoCapitalize: "sentences" as const,
          multiline: false,
          maxLength: 50,
        };
      case "phone":
        return {
          keyboardType: "phone-pad" as const,
          secureTextEntry: false,
          autoCapitalize: "none" as const,
          multiline: false,
          maxLength: 18,
          textContentType: "telephoneNumber" as const,
          autoComplete: "tel" as const,
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
  }, [variant]);

  const applyValidation = (text: string) => {
    const err = validate(text);
    setLocalError(err);
    const ok = !err;
    if (ok !== lastValid) {
      setLastValid(ok);
      onValidityChange?.(ok);
    }
  };

  const handleChange: TextInputProps["onChangeText"] = (text) => {
    if (variant === "phone") {
      const formatted = formatGtPhone(text);
      onChangeText(formatted);
      if (validateOnChange) applyValidation(formatted);
      return;
    }
    onChangeText(text);
    if (validateOnChange) applyValidation(text);
  };

  const handleFocus: TextInputProps["onFocus"] = () => {
    animateBorder(1);
    setLocalError(undefined);
  };

  const handleBlur: TextInputProps["onBlur"] = () => {
    animateBorder(0);
    applyValidation(value);
  };

  const handleEndEditing: TextInputProps["onEndEditing"] = () => {
    applyValidation(value);
  };

  const shownError = errorMessage ?? localError;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              shownError ? "#d9534f" : borderColor,
              shownError ? "#d9534f" : color,
            ],
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
        onChangeText={handleChange}
        placeholderTextColor="#888"
        secureTextEntry={config.secureTextEntry}
        keyboardType={config.keyboardType}
        autoCapitalize={config.autoCapitalize}
        multiline={config.multiline}
        maxLength={config.maxLength}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onEndEditing={handleEndEditing}
        autoComplete={(config as any).autoComplete}
        textContentType={(config as any).textContentType}
      />
      {shownError && <Text style={styles.error}>{shownError}</Text>}
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
    textAlignVertical: "top",
  },
  error: {
    marginTop: 4,
    color: "#d9534f",
    fontSize: 13,
    fontWeight: "500",
  },
});

export default forwardRef(InnerAnimatedInput);
