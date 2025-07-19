import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/type';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const fakeTrips = [
    { id: '1', origen: 'Ciudad de Guatemala', destino: 'Antigua Guatemala', fecha: '2025-07-18 10:00' },
    { id: '2', origen: 'Mixco', destino: 'Escuintla', fecha: '2025-07-17 15:20' },
    { id: '3', origen: 'Zona 16', destino: 'Puerto San José', fecha: '2025-07-16 08:45' }
  ];

  const handleRepeatTrip = (trip: any) => {
    Alert.alert(
      'Repetir viaje',
      `¿Deseas crear un nuevo viaje de ${trip.origen} a ${trip.destino}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: () => console.log('Simulando creación de viaje...', trip) }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Pantalla Home 🏠</Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('FavoriteScreen')}
        >
          <Text style={styles.buttonText}>Ir a Lugares Favoritos</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Últimos viajes</Text>

        <FlatList
          data={fakeTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleRepeatTrip(item)} style={styles.tripItem}>
              <Text style={styles.tripText}>{item.origen} → {item.destino}</Text>
              <Text style={styles.tripDate}>{item.fecha}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 1,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 30
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10
  },
  tripItem: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  tripText: {
    fontSize: 16,
    fontWeight: '500'
  },
  tripDate: {
    fontSize: 12,
    color: '#555'
  }
});