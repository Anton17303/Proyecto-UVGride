import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/type';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';

export default function TravelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeName, setPlaceName] = useState<string>('');

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarker({ latitude, longitude });

    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const name = `${place.name || 'Sin nombre'}, ${place.city || ''}, ${place.region || ''}`;
        setPlaceName(name);
      } else {
        setPlaceName('Lugar desconocido');
      }
    } catch (error) {
      console.error('Error al obtener nombre del lugar:', error);
      setPlaceName('Error al obtener nombre');
    }
  };

  const zoomIn = () => {
    if (region.latitudeDelta > 0.001) {
      setRegion((prev) => ({
        ...prev,
        latitudeDelta: prev.latitudeDelta / 2,
        longitudeDelta: prev.longitudeDelta / 2,
      }));
    }
  };

  const zoomOut = () => {
    if (region.latitudeDelta < 1) {
      setRegion((prev) => ({
        ...prev,
        latitudeDelta: prev.latitudeDelta * 2,
        longitudeDelta: prev.longitudeDelta * 2,
      }));
    }
  };

  const goToTripForm = () => {
    navigation.navigate('TripForm', { origin: placeName });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title={placeName}
            description={'Punto seleccionado'}
          />
        )}
        <Marker
          coordinate={{ latitude: 14.604361, longitude: -90.490041 }}
          title={'UVG'}
          description={'Universidad del Valle de Guatemala'}
          pinColor={'green'}
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
        <Text style={styles.buttonText}>Iniciar viaje</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  zoomContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    padding: 5,
  },
  zoomButton: { padding: 10 },
  zoomText: { fontSize: 24, fontWeight: 'bold' },
  startButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
