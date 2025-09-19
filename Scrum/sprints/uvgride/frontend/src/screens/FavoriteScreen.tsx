import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";

import FloatingActionButton from "../components/FloatingActionButton";
import FavoriteCard from "../components/FavoriteCard";
import EmptyState from "../components/EmptyState";

type LugarFavorito = {
  id_lugar_favorito: number;
  nombre_lugar: string;
  descripcion?: string;
  color_hex?: string;
};

export default function FavoriteScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [favoritos, setFavoritos] = useState<LugarFavorito[]>([]);
  const [loading, setLoading] = useState(true);

  // 📌 Cargar favoritos del backend
  const cargarFavoritos = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/favoritos/usuario/${user.id}`
      );
      setFavoritos(response.data.favoritos || []);
    } catch (err) {
      console.error("❌ Error al cargar favoritos:", err);
      Alert.alert("Error", "No se pudieron cargar los lugares favoritos");
    } finally {
      setLoading(false);
    }
  };

  // 📌 Eliminar favorito
  const eliminarFavorito = async (id: number) => {
    Alert.alert("Eliminar favorito", "¿Quieres eliminar este lugar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/favoritos/${id}`);
            setFavoritos((prev) =>
              prev.filter((fav) => fav.id_lugar_favorito !== id)
            );
          } catch (err) {
            console.error("❌ Error al eliminar favorito:", err);
            Alert.alert("Error", "No se pudo eliminar el lugar");
          }
        },
      },
    ]);
  };

  // 📌 Refrescar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarFavoritos();
    }, [user?.id])
  );

  // 📌 Iniciar un viaje hacia el lugar favorito
  const handleStartTrip = async (lugar: LugarFavorito) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se puede obtener la ubicación");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      navigation.navigate("Home", {
        screen: "Viaje",
        params: {
          screen: "TripFormScreen",
          params: {
            origin: "Ubicación actual",
            latitude,
            longitude,
            destinationName: lugar.nombre_lugar,
          },
        },
      });
    } catch (err) {
      console.error("❌ Error iniciando viaje:", err);
      Alert.alert("Error", "No se pudo iniciar el viaje");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>
        Lugares Favoritos
      </Text>

      {/* Lista o estado vacío */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : favoritos.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title="No tienes lugares favoritos aún"
          subtitle="Agrega un lugar para tenerlo siempre a la mano"
          color={colors.primary}
          textColor={colors.text}
        />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id_lugar_favorito.toString()}
          renderItem={({ item }) => (
            <FavoriteCard
              nombre={item.nombre_lugar}
              descripcion={item.descripcion}
              color={item.color_hex || colors.primary}
              textColor={colors.text}
              backgroundColor={colors.card}
              onPress={() => handleStartTrip(item)}
              onDelete={() => eliminarFavorito(item.id_lugar_favorito)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB para agregar */}
      <FloatingActionButton
        id={`fab_addFavorite_${user?.id}`}
        icon="add"
        label="Agregar lugar"
        backgroundColor={colors.primary}
        onPress={() => navigation.navigate("AddFavorite")}
        style={{ position: "absolute", bottom: 30, right: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
});
