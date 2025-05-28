import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, MapPressEvent } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/core';
import axios from 'axios';
import { RootStackParamList } from '../navigation/type';

const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb';

type TravelRouteProp = RouteProp<RootStackParamList, 'Travel'>;

export default function TravelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [originMarker, setOriginMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    if (params && params.latitude && params.longitude && params.destinationLatitude && params.destinationLongitude) {
      const {
        latitude, longitude,
        destinationLatitude, destinationLongitude,
      } = params;

      const origin = { latitude, longitude };
      const destination = { latitude: destinationLatitude, longitude: destinationLongitude };

      setOriginMarker(origin);
      setDestinationMarker(destination);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      fetchRoute(origin, destination);
    } else {
      console.log('No se recibieron parámetros válidos para la ruta');
    }
  }, [params]);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setOriginMarker({ latitude, longitude });
  };

  const goToTripForm = () => {
    if (!originMarker) {
      Alert.alert('Selecciona un punto válido en el mapa');
      return;
    }

    navigation.navigate('TripFormScreen', {
      origin: 'Origen desde el mapa',
      latitude: originMarker.latitude,
      longitude: originMarker.longitude,
    });
  };

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) => {
    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
        {
          headers: {
            Authorization: OPENROUTESERVICE_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
        );
        setRouteCoords(coords);
      } else {
        Alert.alert('Error', 'No se pudo obtener la ruta');
      }
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
      Alert.alert('Error', 'No se pudo obtener la ruta');
    }
  };

  const zoomIn = () => {
    setRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta / 2,
      longitudeDelta: prev.longitudeDelta / 2,
    }));
  };

  const zoomOut = () => {
    setRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {originMarker && <Marker coordinate={originMarker} title="Origen" />}
        {destinationMarker && <Marker coordinate={destinationMarker} title="Destino" pinColor="red" />}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#4CAF50" strokeWidth={4} />
        )}
        <Marker
          coordinate={{ latitude: 14.604361, longitude: -90.490041 }}
          title="UVG"
          description="Universidad del Valle de Guatemala"
          pinColor="green"
        />
      </MapView>

      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={goToTripForm}>
        <Text style={styles.buttonText}>Seleccionar destino</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  startButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  zoomContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    padding: 5,
    zIndex: 10,
  },
  zoomButton: { padding: 10 },
  zoomText: { fontSize: 24, fontWeight: 'bold' },
});