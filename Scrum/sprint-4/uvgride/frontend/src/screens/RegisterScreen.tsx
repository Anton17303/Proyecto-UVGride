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

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo_institucional, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo_usuario, setTipoUsuario] = useState('');

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Crea una cuenta</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={styles.input}
          value={apellido}
          onChangeText={setApellido}
          placeholder="Apellido"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Correo institucional</Text>
        <TextInput
          style={styles.input}
          value={correo_institucional}
          onChangeText={setCorreo}
          placeholder="correo@uvg.edu.gt"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={contrasenia}
          onChangeText={setContrasenia}
          secureTextEntry
          placeholder="*******"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="12345678"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Tipo de usuario</Text>
        <TextInput
          style={styles.input}
          value={tipo_usuario}
          onChangeText={setTipoUsuario}
          placeholder="estudiante, docente, etc."
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY_COLOR = '#4CAF50';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 32,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  label: {
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 14
  },
  input: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  button: {
    marginTop: 24,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: PRIMARY_COLOR,
    textDecorationLine: 'underline',
    fontSize: 14
  },
});