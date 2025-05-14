import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/type';

type TripFormRouteProp = RouteProp<RootStackParamList, 'TripFormScreen'>;
type TripFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TripFormScreen'>;

export default function TripFormScreen() {
  const route = useRoute<TripFormRouteProp>();
  const navigation = useNavigation<TripFormNavigationProp>();
  const { origin, latitude, longitude } = route.params;

  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTrip = async () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Por favor ingresa un destino válido');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación de guardado

      navigation.navigate('Home', {
        screen: 'Travel',
        params: {
          origin,
          latitude,
          longitude,
          destination,
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo crear el viaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Origen</Text>
      <Text style={styles.value}>{origin}</Text>

      <Text style={styles.label}>Coordenadas</Text>
      <Text style={styles.value}>
        Lat: {latitude.toFixed(6)} / Lon: {longitude.toFixed(6)}
      </Text>

      <Text style={styles.label}>Destino</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa un destino"
        value={destination}
        onChangeText={setDestination}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateTrip} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar viaje'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  value: { fontSize: 16, color: '#333', marginTop: 5 },
  input: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});