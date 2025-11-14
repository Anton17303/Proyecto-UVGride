// src/screens/FavoriteScreen.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";

import { API_URL } from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import {
  BackButton,
  FloatingActionButton,
  FavoriteCard,
  EmptyState,
} from "../components";

type LugarFavorito = {
  id_lugar_favorito: number;
  nombre_lugar: string;
  descripcion?: string;
  color_hex?: string;
};

type FavoriteItemProps = {
  item: LugarFavorito;
  index: number;
  colors: typeof lightColors;
  onStartTrip: (lugar: LugarFavorito) => void;
  onDelete: (id: number) => void;
};

function FavoriteItem({ item, index, colors, onStartTrip, onDelete }: FavoriteItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 10,
      }}
    >
      <FavoriteCard
        nombre={item.nombre_lugar}
        descripcion={item.descripcion}
        color={item.color_hex || colors.primary}
        textColor={colors.text}
        backgroundColor={colors.card}
        onPress={() => onStartTrip(item)}
        onDelete={() => onDelete(item.id_lugar_favorito)}
      />
    </Animated.View>
  );
}

export default function FavoriteScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const [favoritos, setFavoritos] = useState<LugarFavorito[]>([]);
  const [loading, setLoading] = useState(true);

  // Animaciones header + FAB
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // 📌 Cargar favoritos del backend
  const cargarFavoritos = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
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

  // 🔹 Animar header al montar
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslateY]);

  // 🔹 Latido suave del FAB
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [fabScale]);

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
      {/* Header animado */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <BackButton />
        <Text style={[styles.title, { color: colors.text }]}>
          Lugares Favoritos
        </Text>
      </Animated.View>

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
          renderItem={({ item, index }) => (
            <FavoriteItem
              item={item}
              index={index}
              colors={colors}
              onStartTrip={handleStartTrip}
              onDelete={eliminarFavorito}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        />
      )}

      {/* FAB para agregar */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 50,
          right: 20,
          transform: [{ scale: fabScale }],
        }}
      >
        <FloatingActionButton
          id={`fab_addFavorite_${user?.id}`}
          icon="add"
          label="Agregar lugar"
          backgroundColor={colors.primary}
          onPress={() => navigation.navigate("AddFavorite")}
        />
      </Animated.View>
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
