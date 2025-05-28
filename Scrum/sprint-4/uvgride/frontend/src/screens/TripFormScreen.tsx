import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/type';

const OPENROUTESERVICE_API_KEY = 'Poner aquí tu API Key de OpenRouteService';

type TripFormRouteProp = RouteProp<RootStackParamList, 'TripFormScreen'>;
type TripFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TripFormScreen'>;

export default function TripFormScreen() {
  const route = useRoute<TripFormRouteProp>();
  const navigation = useNavigation<TripFormNavigationProp>();
  const { origin, latitude, longitude } = route.params;

  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTrip = async () => {
    if (destination.trim().length < 3) {
      Alert.alert('Error', 'El destino debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    try {
      // ✅ Geocode con OpenRouteService para obtener coordenadas reales del destino
      const url = `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${encodeURIComponent(destination)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;

        // ✅ Redirige a la pantalla Travel con los datos completos (origen y destino)
        navigation.navigate('Travel', {
          origin,
          latitude,
          longitude,
          destination,
          destinationLatitude: lat,
          destinationLongitude: lng,
        });
      } else {
        Alert.alert('Error', 'No se pudo encontrar el destino.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo procesar el destino.');
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
        autoCapitalize="sentences"
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleCreateTrip}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar viaje</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 20, color: '#333' },
  value: { fontSize: 16, color: '#555', marginTop: 5 },
  input: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
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