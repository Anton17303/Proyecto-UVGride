import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { API_URL } from '../services/api';

export default function DriverProfileScreen() {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const { id }: any = route.params;

  useEffect(() => {
    axios.get(`${API_URL}/api/perfil-publico/${id}`) //Ajustar URL
      .then(res => {
        setDriver(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  if (!driver) return <Text>No se encontró información del conductor.</Text>;

  return (
    <View style={styles.container}>
      <Image source={{ uri: driver.foto }} style={styles.image} />
      <Text style={styles.label}>Nombre: {driver.nombre}</Text>
      <Text style={styles.label}>Calificación: {driver.calificacion}</Text>
      {driver.Vehiculo && (
        <>
          <Text style={styles.label}>Vehículo: {driver.Vehiculo.marca} {driver.Vehiculo.modelo}</Text>
          <Text style={styles.label}>Placa: {driver.Vehiculo.placa}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 10 },
});
