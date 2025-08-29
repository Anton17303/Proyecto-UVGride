// src/navigation/type.ts
export type RootStackParamList = {
  // Auth / App root
  Login: undefined;
  Register: undefined;
  Home: undefined;

  // Opcionales (sin params)
  Profile: undefined;
  Settings: undefined;

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

  // Pagos
  Payment: undefined;

  // Conductores
  // driverId puede venir como number o string; rateForGroupId es opcional
  DriverProfile: { driverId: number | string; rateForGroupId?: number | string };

  // 🚀 Grupos
  // Ambos opcionales para soportar fallback groupId/grupoId que usa la screen
  GroupDetail: { groupId?: number | string; grupoId?: number | string };
  GroupCreate: undefined;
};