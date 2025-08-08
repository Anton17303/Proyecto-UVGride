export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;

  // Opcionales (si los usas)
  Profile?: undefined;
  Settings?: undefined;

  Favorite: undefined;
  AddFavorite: undefined;
  VehicleForm: undefined;

  // Puedes entrar sin params (desde el tab) o con coords (después de crear viaje)
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
    latitude: number | null;   // aceptamos null porque a veces dejas que TripForm resuelva la ubicación
    longitude: number | null;
    destinationName?: string;
  };

  // 💡 Necesario para el botón "Programar" en TravelScreen
  ScheduledTripScreen: undefined;

  DriverProfile: {driverId: number};
};