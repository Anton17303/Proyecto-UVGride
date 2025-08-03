import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, MapPressEvent } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/core';
import axios from 'axios';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/type';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62486825133970f449ebbc374649ee03b5eb';
type TravelRouteProp = RouteProp<RootStackParamList, 'Travel'>;

export default function TravelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [originMarker, setOriginMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeDrawn, setRouteDrawn] = useState(false);

  const requestUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Activa los permisos de ubicación para continuar.');
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
      return null;
    }
  };

  const drawRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    try {
      setLoadingRoute(true);
      const res = await axios.post(
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
        }
      );

      const coords = res.data.features[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        })
      );
      setRouteCoords(coords);
      setRouteDrawn(true);
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
      Alert.alert('Error', 'No se pudo calcular la ruta');
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    const setup = async () => {
      if (
        params?.latitude &&
        params?.longitude &&
        params?.destinationLatitude &&
        params?.destinationLongitude &&
        !routeDrawn
      ) {
        const origin = { latitude: params.latitude, longitude: params.longitude };
        const destination = {
          latitude: params.destinationLatitude,
          longitude: params.destinationLongitude,
        };

        setOriginMarker(origin);
        setDestinationMarker(destination);
        setRegion({ ...origin, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        await drawRoute(origin, destination);
      } else if (!params?.latitude || !params?.longitude) {
        const location = await requestUserLocation();
        if (location) {
          setOriginMarker(location);
          setRegion({ ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }
      }
    };
    setup();
  }, []);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setOriginMarker({ latitude, longitude });
  };

  const goToTripForm = () => {
    if (!originMarker) {
      Alert.alert('Por favor selecciona un punto válido en el mapa.');
      return;
    }

    navigation.navigate('TripFormScreen', {
      origin: 'Origen desde el mapa',
      latitude: originMarker.latitude,
      longitude: originMarker.longitude,
    });
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
          <Polyline coordinates={routeCoords} strokeColor={colors.primary} strokeWidth={4} />
        )}
        <Marker
          coordinate={{ latitude: 14.604361, longitude: -90.490041 }}
          title="UVG"
          description="Universidad del Valle de Guatemala"
          pinColor="green"
        />
      </MapView>

      <View style={[styles.zoomContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.zoomButton} onPress={() =>
          setRegion(prev => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta / 2,
            longitudeDelta: prev.longitudeDelta / 2,
          }))
        }>
          <Text style={[styles.zoomText, { color: colors.text }]}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.zoomButton} onPress={() =>
          setRegion(prev => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta * 2,
            longitudeDelta: prev.longitudeDelta * 2,
          }))
        }>
          <Text style={[styles.zoomText, { color: colors.text }]}>−</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.primary }]}
        onPress={goToTripForm}
      >
        <Text style={styles.buttonText}>Seleccionar destino</Text>
      </TouchableOpacity>

      {loadingRoute && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.modalText, { color: colors.text, marginTop: 12 }]}>Recalculando ruta...</Text>
          </View>
        </View>
      )}
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  zoomContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    borderRadius: 8,
    padding: 5,
    zIndex: 10,
  },
  zoomButton: { padding: 10 },
  zoomText: { fontSize: 24, fontWeight: 'bold' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '600',
  },
});