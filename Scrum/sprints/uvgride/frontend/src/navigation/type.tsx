// src/navigation/type.ts
export type RootStackParamList = {
  // Auth / App root
  Login: undefined;
  Register: undefined;
  Home: undefined;

  // Opcionales
  Profile?: undefined;
  Settings?: undefined;

  // Favoritos / Vehículos
  Favorite: undefined;
  AddFavorite: undefined;
  VehicleForm: undefined;

  // Viajes
  Travel:
    | undefined
    | {
        origin?: string;
        latitude?: number;
        longitude?: number;
        destination?: string;
        destinationLatitude?: number;
        destinationLongitude?: number;
      };

  TripFormScreen: {
    origin: string;
    latitude: number | null;
    longitude: number | null;
    destinationName?: string;
  };

  ScheduledTripScreen: undefined;

  // Conductores
  // driverId puede venir como number o string desde params; rateForGroupId es opcional
  DriverProfile: { driverId: number | string; rateForGroupId?: number | string };

  // 🚀 Grupos
  // Hacemos ambos opcionales para soportar el fallback groupId/grupoId usado en la screen
  GroupDetail: { groupId?: number | string; grupoId?: number | string };
  GroupCreate: undefined;
};