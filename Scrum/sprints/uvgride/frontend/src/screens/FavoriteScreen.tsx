// src/screens/FavoriteScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
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

// 🌀 Reanimated
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInUp,
  Layout,
} from "react-native-reanimated";

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
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40) // más rápido que 70ms
        .duration(220)                     // un pelín más corta
        .easing(Easing.out(Easing.quad))}
      layout={Layout.springify().damping(18).stiffness(160)}
      style={{ marginBottom: 10 }}
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

  // 🌀 Animaciones header + FAB (Reanimated)
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-10);
  const fabScale = useSharedValue(1);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

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

  // 📌 Refrescar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarFavoritos();
    }, [user?.id])
  );

  // 🔹 Animar header cada vez que entras a la pantalla
  useFocusEffect(
    useCallback(() => {
      headerOpacity.value = 0;
      headerTranslateY.value = -10;

      headerOpacity.value = withTiming(1, {
        duration: 320,
        easing: Easing.out(Easing.quad),
      });
      headerTranslateY.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.quad),
      });
    }, [headerOpacity, headerTranslateY])
  );

  // 🔹 Latido suave del FAB (más sutil)
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: 1100,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: 1100,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1, // infinito
      true // auto-reverse
    );

    return () => {
      fabScale.value = 1;
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header animado: back + título */}
      <Animated.View style={headerAnimatedStyle}>
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

      {/* FAB para agregar (con latido sutil) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 50,
            right: 20,
          },
          fabAnimatedStyle,
        ]}
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
