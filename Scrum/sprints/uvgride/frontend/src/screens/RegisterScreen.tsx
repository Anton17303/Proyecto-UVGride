import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_URL } from '../services/api';
import { RootStackParamList } from '../type';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo_institucional, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo_usuario, setTipoUsuario] = useState('');

  const { theme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

  const handleRegister = async () => {
    if (!nombre || !apellido || !correo_institucional || !contrasenia || !telefono || !tipo_usuario) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        nombre,
        apellido,
        correo_institucional,
        contrasenia,
        telefono,
        tipo_usuario,
      });

      Alert.alert('Registrado', `¡Bienvenido ${res.data.usuario.nombre}!`);
      navigation.navigate('Login');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'Error al registrar');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.title, { color: colors.text }]}>Crea una cuenta</Text>

        <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>Apellido</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={apellido}
          onChangeText={setApellido}
          placeholder="Apellido"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>Correo institucional</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={correo_institucional}
          onChangeText={setCorreo}
          placeholder="correo@uvg.edu.gt"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={contrasenia}
          onChangeText={setContrasenia}
          secureTextEntry
          placeholder="*******"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>Teléfono</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="12345678"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>Tipo de usuario</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={tipo_usuario}
          onChangeText={setTipoUsuario}
          placeholder="estudiante, docente, etc."
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  label: {
    marginBottom: 6,
    marginTop: 12,
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});