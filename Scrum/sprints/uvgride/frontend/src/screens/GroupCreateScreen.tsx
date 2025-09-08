// src/screens/GroupCreateScreen.tsx
import React, { useMemo, useRef, useState } from 'react';
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

function clampInt(v: number, min = 1, max = 99) {
  if (!Number.isFinite(v)) return NaN as unknown as number;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function parseCurrency2dec(raw: string): number | null {
  if (raw.trim() === '') return null;
  const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return NaN as unknown as number;
  return Math.round(n * 100) / 100;
}

function toIsoMaybe(str: string): string | null {
  if (!str) return null;
  // Si ya es ISO válido, lo dejamos
  const asIs = new Date(str);
  if (!Number.isNaN(asIs.getTime())) return new Date(asIs.getTime()).toISOString();

  // Intento suave: "YYYY-MM-DD HH:mm"
  const soft = str.replace(' ', 'T');
  const d = new Date(soft);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  return null;
}

export default function GroupCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const destinoRef = useRef<TextInput>(null);
  const cuposRef = useRef<TextInput>(null);
  const fechaRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);

  const [destino, setDestino] = useState('');
  const [cupos, setCupos] = useState<string>('3');
  const [fecha, setFecha] = useState<string>('');  // libre, lo convertimos a ISO al enviar
  const [costo, setCosto] = useState<string>('');  // máscara
  const [loading, setLoading] = useState(false);

  const esConductor = (user?.tipo_usuario || '').toLowerCase() === 'conductor';

  /* ---------- Validaciones ---------- */
  const destinoErr = useMemo(() => (destino.trim() ? '' : 'Ingresa un destino.'), [destino]);

  const cuposErr = useMemo(() => {
    if (cupos.trim() === '') return 'Ingresa el número de cupos.';
    const n = clampInt(Number(cupos), 1, 99);
    if (!Number.isFinite(n)) return 'Debe ser un entero.';
    if (n <= 0) return 'Debe ser un entero > 0.';
    return '';
  }, [cupos]);

  const costoErr = useMemo(() => {
    if (costo.trim() === '') return '';
    const n = parseCurrency2dec(costo);
    if (n === null) return '';
    if (Number.isNaN(n) || n < 0) return 'Ingresa un costo válido (>= 0).';
    return '';
  }, [costo]);

  const fechaErr = useMemo(() => {
    if (fecha.trim() === '') return '';
    return toIsoMaybe(fecha) ? '' : 'Fecha inválida. Ej: 2025-08-26 18:30 o ISO.';
  }, [fecha]);

  const isFormValid = useMemo(
    () => !destinoErr && !cuposErr && !costoErr && !fechaErr,
    [destinoErr, cuposErr, costoErr, fechaErr]
  );

  /* ---------- Helpers UI ---------- */
  const setCuposMasked = (t: string) => setCupos(t.replace(/[^\d]/g, ''));
  const setCostoMasked = (t: string) => {
    let v = t.replace(/[^\d.,]/g, '');
    const parts = v.replace(',', '.').split('.');
    if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join('')}`;
    const [ent, dec] = v.split(/[.,]/);
    if (dec && dec.length > 2) v = `${ent}.${dec.slice(0, 2)}`;
    setCosto(v);
  };
  const fillNowPlus30 = () => setFecha(new Date(Date.now() + 30 * 60 * 1000).toISOString());

  /* ---------- Submit ---------- */
  const onSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Sesión', 'Inicia sesión nuevamente.');
      return;
    }
    if (!esConductor) {
      Alert.alert('No disponible', 'Solo los conductores pueden crear grupos.');
      return;
    }
    if (!isFormValid) {
      Alert.alert(
        'Revisa el formulario',
        [destinoErr, cuposErr, costoErr, fechaErr].filter(Boolean).join('\n')
      );
      return;
    }

    const nCupos = clampInt(Number(cupos), 1, 99);
    const nCosto = parseCurrency2dec(costo); // puede ser null
    const fechaIso = fecha.trim() ? toIsoMaybe(fecha.trim()) : null;

    try {
      setLoading(true);

      await createGroup({
        conductor_id: Number(user.id),
        destino_nombre: destino.trim(),
        cupos_totales: nCupos,
        fecha_salida: fechaIso ?? undefined,
        precio_base: nCosto ?? undefined,
      });

      Alert.alert('Éxito', 'Grupo creado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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

  const submitDisabled = loading || !isFormValid || !esConductor;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: colors.text }]}>Crear grupo</Text>

          {!esConductor && (
            <Text style={[styles.note, { color: colors.text }]}>
              Solo los conductores pueden crear grupos.
            </Text>
          )}

          {/* Destino */}
          <Text style={[styles.label, { color: colors.text }]}>Destino</Text>
          <TextInput
            ref={destinoRef}
            value={destino}
            onChangeText={setDestino}
            placeholder="Ej. Cayalá"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => cuposRef.current?.focus()}
          />
          {!!destinoErr && <Text style={styles.err}>{destinoErr}</Text>}

          {/* Cupos */}
          <Text style={[styles.label, { color: colors.text }]}>Cupos totales</Text>
          <TextInput
            ref={cuposRef}
            value={cupos}
            onChangeText={setCuposMasked}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="3"
            placeholderTextColor="#888"
            returnKeyType="next"
            onSubmitEditing={() => fechaRef.current?.focus()}
          />
          {!!cuposErr && <Text style={styles.err}>{cuposErr}</Text>}

          {/* Fecha */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.label, { color: colors.text, flex: 1 }]}>
              Fecha de salida (opcional)
            </Text>
            <TouchableOpacity onPress={fillNowPlus30} style={styles.chip}>
              <Text style={styles.chipTxt}>+30 min</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            ref={fechaRef}
            value={fecha}
            onChangeText={setFecha}
            placeholder="2025-08-26 18:30  o  2025-08-26T18:30:00Z"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => costoRef.current?.focus()}
          />
          {!!fechaErr && <Text style={styles.err}>{fechaErr}</Text>}

          {/* Costo */}
          <Text style={[styles.label, { color: colors.text }]}>Costo estimado (opcional)</Text>
          <TextInput
            ref={costoRef}
            value={costo}
            onChangeText={setCostoMasked}
            keyboardType="decimal-pad"
            placeholder="50"
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholderTextColor="#888"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          {!!costoErr && <Text style={styles.err}>{costoErr}</Text>}

          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: colors.primary },
              submitDisabled && { opacity: 0.6 },
            ]}
            onPress={onSubmit}
            disabled={submitDisabled}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Crear grupo</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  note: { marginBottom: 8, opacity: 0.8 },
  label: { fontSize: 14, marginTop: 10, marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  err: { color: '#d32f2f', fontSize: 12, marginTop: 2 },
  chip: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipTxt: { fontWeight: '700', color: '#444', fontSize: 12 },
  btn: { marginTop: 18, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800' },
});