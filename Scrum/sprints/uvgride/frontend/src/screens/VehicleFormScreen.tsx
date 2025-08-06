import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

export default function VehicleFormScreen({ navigation }: any) {
  const { user } = useUser();
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [color, setColor] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const handleRegister = async () => {
    if (!marca || !modelo || !placa || !color || !capacidad) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/vehiculos`, {
        id_usuario: user?.id,
        marca,
        modelo,
        placa,
        color,
        capacidad_pasajeros: parseInt(capacidad),
      });

      Alert.alert('Éxito', 'Vehículo registrado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error registrando vehículo:', error);
      Alert.alert('Error', 'No se pudo registrar el vehículo');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Registrar Vehículo</Text>

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Marca"
        placeholderTextColor={colors.textPlaceholder}
        value={marca}
        onChangeText={setMarca}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Modelo"
        placeholderTextColor={colors.textPlaceholder}
        value={modelo}
        onChangeText={setModelo}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Placa"
        placeholderTextColor={colors.textPlaceholder}
        value={placa}
        onChangeText={setPlaca}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Color"
        placeholderTextColor={colors.textPlaceholder}
        value={color}
        onChangeText={setColor}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Capacidad de pasajeros"
        placeholderTextColor={colors.textPlaceholder}
        value={capacidad}
        onChangeText={setCapacidad}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Registrar vehículo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={[styles.cancelText, { color: colors.primary }]}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelText: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});