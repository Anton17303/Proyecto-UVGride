import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/type';
import { createGroup } from '../services/groups';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupCreate'>;

export default function GroupCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const [destino, setDestino] = useState('');
  const [cupos, setCupos] = useState<string>('3');
  const [fecha, setFecha] = useState<string>(''); // ISO opcional
  const [costo, setCosto] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Sesión', 'Inicia sesión nuevamente.');
      return;
    }

    const destinoNorm = destino.trim();
    if (!destinoNorm) {
      Alert.alert('Destino', 'Ingresa un destino.');
      return;
    }

    // normaliza cupos (solo enteros positivos)
    const nCupos = Number.parseInt(cupos, 10);
    if (!Number.isInteger(nCupos) || nCupos <= 0) {
      Alert.alert('Cupos', 'Debe ser un entero mayor a 0.');
      return;
    }

    // normaliza costo (opcional >= 0)
    const nCosto =
      costo.trim() === '' ? null : Number(costo.replace(',', '.'));
    if (nCosto != null && (!Number.isFinite(nCosto) || nCosto < 0)) {
      Alert.alert('Costo', 'Ingresa un costo válido (>= 0).');
      return;
    }

    // fecha opcional: si viene, intentamos parsear
    const fechaOut = fecha.trim();
    if (fechaOut) {
      const d = new Date(fechaOut);
      if (Number.isNaN(d.getTime())) {
        Alert.alert('Fecha', 'Fecha inválida. Usa formato ISO (p. ej. 2025-08-26T18:30:00Z).');
        return;
      }
    }

    try {
      setLoading(true);

      // Enviamos ambos nombres por compatibilidad con el backend:
      const payload: any = {
        conductor_id: user.id,
        destino_nombre: destinoNorm, // backend también acepta 'destino'
        capacidad_total: nCupos,     // nombre preferido
        cupos_totales: nCupos,       // alias aceptado
      };
      if (fechaOut) payload.fecha_salida = fechaOut;
      if (nCosto != null) payload.costo_estimado = nCosto;

      await createGroup(payload);

      Alert.alert('Éxito', 'Grupo creado.');
      navigation.goBack();
    } catch (e: any) {
      console.error('crear grupo error:', e?.response?.data || e?.message);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        'No se pudo crear el grupo.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: colors.text }]}>Crear grupo</Text>

          <Text style={[styles.label, { color: colors.text }]}>Destino</Text>
          <TextInput
            value={destino}
            onChangeText={setDestino}
            placeholder="Ej. Cayalá"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
            autoCapitalize="sentences"
          />

          <Text style={[styles.label, { color: colors.text }]}>Cupos totales</Text>
          <TextInput
            value={cupos}
            onChangeText={(t) => setCupos(t.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="3"
            placeholderTextColor="#888"
          />

          <Text style={[styles.label, { color: colors.text }]}>Fecha de salida (opcional, ISO)</Text>
          <TextInput
            value={fecha}
            onChangeText={setFecha}
            placeholder="2025-08-26T18:30:00Z"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>Costo estimado (opcional)</Text>
          <TextInput
            value={costo}
            onChangeText={setCosto}
            keyboardType="decimal-pad"
            placeholder="50"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: colors.primary },
              loading && { opacity: 0.6 },
            ]}
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>Crear grupo</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 14, marginTop: 10, marginBottom: 6 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  btn: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '800' },
});