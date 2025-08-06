export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Favorite: undefined;
  AddFavorite: undefined;
  VehicleForm: undefined;
  Travel: {
    origin: string;
    latitude: number;
    longitude: number;
    destination: string;
    destinationLatitude: number;
    destinationLongitude: number;
  };
  TripFormScreen: {
    origin: string;
    latitude: number;
    longitude: number;
    destinationName?: string;
  };
};