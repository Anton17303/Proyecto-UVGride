import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
// import axios from 'axios'; ← cuando tengas el backend
// import { API_URL } from '../services/api';

type LugarFavorito = {
  id_lugar_favorito: number;
  nombre_lugar: string;
  descripcion?: string;
  latitud?: number;
  longitud?: number;
};

export default function FavoriteScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [favoritos, setFavoritos] = useState<LugarFavorito[]>([]);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    // const res = await axios.get(`${API_URL}/api/favoritos/${user.id}`);
    // setFavoritos(res.data);

    // Mock temporal:
    setFavoritos([
      {
        id_lugar_favorito: 1,
        nombre_lugar: 'Antigua Guatemala',
        descripcion: 'Una ciudad colonial hermosa',
        latitud: 14.5595,
        longitud: -90.7344,
      },
      {
        id_lugar_favorito: 2,
        nombre_lugar: 'Lago de Atitlán',
        descripcion: 'Perfecto para descansar',
        latitud: 14.7301,
        longitud: -91.2294,
      }
    ]);
  };

  const renderItem = ({ item }: { item: LugarFavorito }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.nombre_lugar}</Text>
      {item.descripcion && <Text style={styles.description}>{item.descripcion}</Text>}
      <Text style={styles.coords}>
        Lat: {item.latitud?.toFixed(4)}, Lon: {item.longitud?.toFixed(4)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lugares Favoritos</Text>

      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id_lugar_favorito.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddFavorite')}
      >
        <Text style={styles.addButtonText}>+ Agregar nuevo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backButtonText}>← Volver al menú</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center', // ✅ Título centrado
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#555', marginVertical: 4 },
  coords: { fontSize: 12, color: '#777' },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 40, // ✅ margen horizontal
    marginTop: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});