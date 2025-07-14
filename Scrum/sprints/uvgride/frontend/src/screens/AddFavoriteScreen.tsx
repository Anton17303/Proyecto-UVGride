import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import axios from 'axios';
// import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';

export default function AddFavoriteScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('');

  const handleGuardar = async () => {
    if (!nombre || !color) {
      Alert.alert('Error', 'El nombre y el color son obligatorios');
      return;
    }

    // const nuevoLugar = {
    //   id_usuario: user.id,
    //   nombre_lugar: nombre,
    //   descripcion,
    //   color_hex: color
    // };

    // try {
    //   await axios.post(`${API_URL}/api/favoritos`, nuevoLugar);
    //   Alert.alert('Éxito', 'Lugar agregado a favoritos');
    //   navigation.goBack();
    // } catch (err) {
    //   console.error(err);
    //   Alert.alert('Error', 'No se pudo guardar el lugar');
    // }

    Alert.alert('Simulado', `Lugar agregado con color ${color}`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Agregar Lugar Favorito</Text>

        <Text style={styles.label}>Nombre del lugar *</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Volcán de Pacaya"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Algo que quieras recordar del lugar"
          multiline
        />

        <Text style={styles.label}>Color personalizado *</Text>
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="Ej. #4CAF50"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Lugar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#555'
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  backText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline'
  }
});