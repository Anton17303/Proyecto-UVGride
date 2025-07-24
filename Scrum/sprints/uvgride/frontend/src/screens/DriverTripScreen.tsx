import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function DriverTripScreen() {
  // Simulación de datos de viaje
  const origin = { latitude: 14.604361, longitude: -90.490041 }; // UVG
  const pickup = { latitude: 14.610000, longitude: -90.500000 }; // Punto de recogida
  const destination = { latitude: 14.620000, longitude: -90.510000 }; // Destino

  // Ruta simulada
  const routeCoords = [
    origin,
    pickup,
    destination,
  ];
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker coordinate={pickup} title="Recoger pasajero" />
        <Marker coordinate={destination} title="Destino" pinColor="black" />
        <Marker coordinate={origin} title="Tú" pinColor="blue" />
        <Polyline coordinates={routeCoords} strokeColor="#000" strokeWidth={4} />
      </MapView>

      <View style={styles.card}>
        <View style={styles.tripHeader}>
          <Text style={styles.uberType}>UVGRideX</Text>
          <Text style={styles.price}>Q45.00</Text>
        </View>
        <Text style={styles.rating}>★ 4.95  •  Verificado</Text>
        <View style={styles.infoRow}>
          <Text style={styles.time}>3 min (1.1 km) away</Text>
          <Text style={styles.address}>Edificio F, UVG</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.time}>20 min (7.3 km) trip</Text>
          <Text style={styles.address}>Oakland Mall, Zona 10</Text>
        </View>
        <TouchableOpacity style={styles.acceptButton}>
          <Text style={styles.acceptText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
