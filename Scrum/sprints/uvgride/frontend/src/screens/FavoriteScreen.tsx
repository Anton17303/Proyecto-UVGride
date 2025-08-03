import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

type LugarFavorito = {
  id_lugar_favorito: number;
  nombre_lugar: string;
  descripcion?: string;
  color_hex?: string;
};

export default function FavoriteScreen() {
  const navigation = useNavigation<any>(); // 👈 usamos tipo 'any' para permitir navegación anidada
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const [favoritos, setFavoritos] = useState<LugarFavorito[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarFavoritos = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`${API_URL}/api/favoritos/usuario/${user.id}`);
      setFavoritos(response.data.favoritos || []);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
      Alert.alert('Error', 'No se pudieron cargar los lugares favoritos');
    } finally {
      setLoading(false);
    }
  };

  const eliminarFavorito = async (id: number) => {
    Alert.alert(
      'Eliminar favorito',
      '¿Estás seguro de que deseas eliminar este lugar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/favoritos/${id}`);
              setFavoritos((prev) => prev.filter((fav) => fav.id_lugar_favorito !== id));
              Alert.alert('Eliminado', 'Lugar favorito eliminado correctamente');
            } catch (err) {
              console.error('Error al eliminar favorito:', err);
              Alert.alert('Error', 'No se pudo eliminar el lugar');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      cargarFavoritos();
    }, [user?.id])
  );

  const handleStartTrip = (lugar: LugarFavorito) => {
    navigation.navigate('Tabs', {
      screen: 'Viaje',
      params: {
        screen: 'TripFormScreen',
        params: {
          origin: 'Ubicación actual',
          latitude: null,
          longitude: null,
          destinationName: lugar.nombre_lugar,
        },
      },
    });
  };

  const renderItem = ({ item }: { item: LugarFavorito }) => (
    <TouchableOpacity
      onPress={() => handleStartTrip(item)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderLeftColor: item.color_hex || colors.primary,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: item.color_hex || colors.text }]}>
          {item.nombre_lugar}
        </Text>
        {item.descripcion && (
          <Text style={[styles.description, { color: colors.text }]}>{item.descripcion}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => eliminarFavorito(item.id_lugar_favorito)}>
        <Text style={styles.deleteButton}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Lugares Favoritos</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : favoritos.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No tienes lugares favoritos aún.
        </Text>
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id_lugar_favorito.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddFavoriteScreen')}
      >
        <Text style={styles.addButtonText}>+ Agregar nuevo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Inicio')}
      >
        <Text style={[styles.backButtonText, { color: colors.primary }]}>
          ← Volver al menú
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    marginHorizontal: 8,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    fontSize: 20,
    color: '#d9534f',
    marginLeft: 12,
  },
  addButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 40,
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
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 30,
  },
});