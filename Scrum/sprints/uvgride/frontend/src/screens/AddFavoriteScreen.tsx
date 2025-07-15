import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';

const COLORES = ['#ff6961', '#77dd77', '#fdfd96', '#84b6f4', '#fdcae1'];

export default function AddFavoriteScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState(COLORES[0]);

  const handleGuardar = async () => {
    if (!nombre.trim() || !color.trim()) {
      Alert.alert('Error', 'El nombre y el color son obligatorios');
      return;
    }

    const nuevoFavorito = {
      id_usuario: user?.id,
      nombre_lugar: nombre.trim(),
      descripcion: descripcion.trim() || null,
      color_hex: color.trim(),
    };

    try {
      const response = await axios.post(`${API_URL}/api/favoritos`, nuevoFavorito);

      if (response.status === 201 || response.data?.success) {
        Alert.alert('Éxito', 'Lugar agregado a favoritos');
        navigation.goBack();
      } else {
        throw new Error('No se pudo guardar el lugar');
      }
    } catch (err: any) {
      console.error('❌ Error al guardar favorito:', err?.response?.data || err.message);
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo guardar el lugar');
    }
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
        <View style={styles.colorRow}>
          {COLORES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c, borderWidth: color === c ? 3 : 1 },
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

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
  safeArea: { flex: 1, backgroundColor: '#fff' },
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
    color: '#555',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});