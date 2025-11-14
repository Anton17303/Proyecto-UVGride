// src/screens/TravelScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  MapPressEvent,
  Circle,
} from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/core";
import * as Location from "expo-location";
import Ionicons from "react-native-vector-icons/Ionicons";

// 🌀 Reanimated
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
} from "react-native-reanimated";

import { RootStackParamList } from "../navigation/type";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../constants/colors";
import { useTravelRoute } from "../hooks/useTravelRoute";
import {
  FloatingActionButton,
  ZoomControls,
  RouteInfoCard,
  LoadingModal,
} from "../components";

type TravelRouteProp = RouteProp<RootStackParamList, "Travel">;
type UserPos = { lat: number; lng: number; accuracy?: number | null };

export default function TravelScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<TravelRouteProp>();
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;

  const STATUS_OFFSET = Platform.OS === "ios" ? 52 : 24;

  const { origin, setOrigin, destination, coords, summary, loading, drawRoute } =
    useTravelRoute(params);

  const [region, setRegion] = useState({
    latitude: 14.604361,
    longitude: -90.490041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [userPos, setUserPos] = useState<UserPos | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  // Seguir al usuario y throttling de recálculo
  const [followUser, setFollowUser] = useState(false);
  const lastRouteRef = useRef<{ at: number; lat?: number; lng?: number }>({
    at: 0,
  });

  // 🔹 Animaciones (Reanimated)
  const [showHint, setShowHint] = useState(!origin);
  const hintOpacity = useSharedValue(origin ? 0 : 1);

  const summaryOpacity = useSharedValue(0);
  const summaryTranslateY = useSharedValue(-10);

  const fabScale = useSharedValue(1);

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  const summaryAnimatedStyle = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
    transform: [{ translateY: summaryTranslateY.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setOrigin({ latitude, longitude });
  };

  const goToTripForm = () => {
    if (!origin) {
      Alert.alert("Por favor selecciona un punto válido en el mapa.");
      return;
    }
    navigation.navigate("TripFormScreen", {
      origin: "Origen desde el mapa",
      latitude: origin.latitude,
      longitude: origin.longitude,
    });
  };

  const goToScheduledList = () => navigation.navigate("ScheduledTripScreen");

  const ensureWatcher = async () => {
    if (watcherRef.current) return watcherRef.current;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Activa los permisos de ubicación para continuar."
      );
      return null;
    }
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 1500,
      },
      async (loc) => {
        const { latitude, longitude, accuracy } = loc.coords;
        setUserPos({ lat: latitude, lng: longitude, accuracy });

        // Seguir al usuario en el mapa
        if (followUser) {
          setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        }

        // Si hay destino, recalcula ruta con throttling
        if (destination) {
          const now = Date.now();
          const movedEnough =
            distanceMeters(
              {
                latitude: lastRouteRef.current.lat ?? latitude,
                longitude: lastRouteRef.current.lng ?? longitude,
              },
              { latitude, longitude }
            ) > 25; // recalc si moviste ~25m

          const cooldownPassed = now - lastRouteRef.current.at > 6000; // cada ~6s máx

          if (movedEnough && cooldownPassed) {
            setOrigin({ latitude, longitude }); // actualiza estado visible
            await drawRoute({ latitude, longitude }, destination);
            lastRouteRef.current = { at: now, lat: latitude, lng: longitude };
          }
        }
      }
    );
    watcherRef.current = sub;
    return sub;
  };

  useEffect(() => {
    // Inicia watcher al montar
    (async () => {
      await ensureWatcher();
    })();

    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando ya existe una ruta, actualiza la referencia de último origen usado
  useEffect(() => {
    if (origin && coords.length > 0) {
      lastRouteRef.current = {
        at: Date.now(),
        lat: origin.latitude,
        lng: origin.longitude,
      };
    }
  }, [coords.length, origin]);

  const centerOnUser = async () => {
    try {
      const sub = await ensureWatcher();
      if (!sub) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy } = location.coords;

      setUserPos({ lat: latitude, lng: longitude, accuracy });
      setRegion((prev) => ({
        ...prev,
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }));

      if (!origin) setOrigin({ latitude, longitude });
      setFollowUser(true); // activar follow al centrar
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación.");
    }
  };

  // 🔹 Animación del hint según si ya hay origen o no
  useEffect(() => {
    if (!origin) {
      setShowHint(true);
      hintOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    } else {
      hintOpacity.value = withTiming(
        0,
        {
          duration: 220,
          easing: Easing.in(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(setShowHint)(false);
          }
        }
      );
    }
  }, [origin, hintOpacity]);

  // 🔹 Animación de entrada de la RouteInfoCard cuando hay summary
  useEffect(() => {
    if (summary) {
      summaryOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
      summaryTranslateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    } else {
      summaryOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
      summaryTranslateY.value = withTiming(-8, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [summary, summaryOpacity, summaryTranslateY]);

  // 🔹 Animación “latido” para los FABs (sutil)
  useEffect(() => {
    fabScale.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: 900,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: 900,
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsCompass
      >
        {userPos && (
          <>
            <Marker coordinate={{ latitude: userPos.lat, longitude: userPos.lng }}>
              <BlueDot />
            </Marker>
            {typeof userPos.accuracy === "number" && userPos.accuracy > 0 && (
              <Circle
                center={{ latitude: userPos.lat, longitude: userPos.lng }}
                radius={userPos.accuracy}
                strokeColor="rgba(30,144,255,0.3)"
                fillColor="rgba(30,144,255,0.15)"
              />
            )}
          </>
        )}

        {origin && <Marker coordinate={origin} title="Origen" />}
        {destination && (
          <Marker coordinate={destination} title="Destino" pinColor="red" />
        )}
        {coords.length > 0 && (
          <Polyline
            coordinates={coords}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Route info animada */}
      {summary && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: STATUS_OFFSET + 20,
              alignSelf: "center",
            },
            summaryAnimatedStyle,
          ]}
        >
          <RouteInfoCard
            durationSec={summary.durationSec}
            distanceKm={summary.distanceKm}
            backgroundColor={colors.card}
            borderColor={colors.border}
            textColor={colors.text}
          />
        </Animated.View>
      )}

      {/* Hint para tocar el mapa */}
      {showHint && (
        <Animated.View
          style={[
            styles.hintContainer,
            hintAnimatedStyle,
            { backgroundColor: `${colors.card}DD` },
          ]}
        >
          <Text style={[styles.hintText, { color: colors.text }]}>
            Toca el mapa para elegir tu origen
          </Text>
        </Animated.View>
      )}

      {/* Centrar en usuario */}
      <TouchableOpacity
        style={[styles.locationBtn, { backgroundColor: colors.card }]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Toggle seguir usuario */}
      <TouchableOpacity
        style={[styles.followBtn, { backgroundColor: colors.card }]}
        onPress={() => setFollowUser((v) => !v)}
      >
        <Ionicons
          name={followUser ? "navigate" : "navigate-outline"}
          size={22}
          color={colors.primary}
        />
      </TouchableOpacity>

      <ZoomControls
        onZoomIn={() =>
          setRegion((prev) => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta / 2,
            longitudeDelta: prev.longitudeDelta / 2,
          }))
        }
        onZoomOut={() =>
          setRegion((prev) => ({
            ...prev,
            latitudeDelta: prev.latitudeDelta * 2,
            longitudeDelta: prev.longitudeDelta * 2,
          }))
        }
        buttonColor={colors.primary}
        backgroundColor={colors.card}
        style={{ position: "absolute", bottom: 40, left: 20 }}
      />

      {/* FABs con latido compartido */}
      <Animated.View
        style={[
          styles.fabContainer,
          { bottom: 40, right: 20 },
          fabAnimatedStyle,
        ]}
      >
        <FloatingActionButton
          id="navigate"
          icon="navigate"
          label="Nuevo Viaje"
          backgroundColor={colors.primary}
          onPress={goToTripForm}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.fabContainer,
          { bottom: 110, right: 20 },
          fabAnimatedStyle,
        ]}
      >
        <FloatingActionButton
          id="calendar"
          icon="calendar-outline"
          label="Programados"
          backgroundColor={colors.primary}
          onPress={goToScheduledList}
        />
      </Animated.View>

      <LoadingModal
        visible={loading}
        message="Recalculando ruta..."
        backgroundColor={colors.card}
        textColor={colors.text}
        spinnerColor={colors.primary}
      />
    </View>
  );
}

function BlueDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, {
          duration: 700,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: 700,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, {
          duration: 700,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: 700,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1,
      true
    );

    return () => {
      scale.value = 1;
      opacity.value = 1;
    };
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        {
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: "#1E90FF",
          borderWidth: 2,
          borderColor: "#fff",
        },
        animatedStyle,
      ]}
    />
  );
}

// Distancia Haversine en metros
function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const x =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hintContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -120 }, { translateY: -20 }],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hintText: { fontSize: 14, textAlign: "center" },
  locationBtn: {
    position: "absolute",
    bottom: 165,
    left: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  followBtn: {
    position: "absolute",
    bottom: 220,
    left: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  fabContainer: {
    position: "absolute",
  },
});
