import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export default function TravelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de Viajes ✈️</Text>
      
      {/* Imagen del mapa */}
      <Image
        source={{ uri: 'https://www.kiwinomada.com/images/media/cities-maps/map-guatemala-city-500x500px.jpg' }} 
        style={styles.mapImage}
      />

      {/* Botón para volver atrás */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'flex-start',
    alignItems: 'center', 
    backgroundColor: '#f5f5f5',
  },
  text: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mapImage: {
    width: '100%',
    height: 300,  
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#6200ee',
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
