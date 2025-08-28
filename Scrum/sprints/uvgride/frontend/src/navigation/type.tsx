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

  // Pagos
  Payment: undefined;

  // Conductores
  DriverProfile: { driverId: number };

  // 🚀 Grupos
  GroupDetail: { groupId: number }; // detalle de un grupo
  GroupCreate: undefined;           // formulario para crear grupo (conductor)
};
