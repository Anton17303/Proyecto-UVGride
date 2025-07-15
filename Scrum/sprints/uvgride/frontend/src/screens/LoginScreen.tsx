import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_URL } from '../services/api';
import { useUser } from '../context/UserContext';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [correo_institucional, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserFromBackend } = useUser();

  const handleLogin = async () => {
    if (!correo_institucional || !contrasenia) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        correo_institucional,
        contrasenia,
      });

      setUserFromBackend(res.data.usuario); // ✅ Corrección aquí

      Alert.alert('¡Bienvenido!', `Hola ${res.data.usuario.nombre}`);
      navigation.navigate('Home');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Inicia sesión</Text>

        <Text style={styles.label}>Correo institucional</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@uvg.edu.gt"
          value={correo_institucional}
          onChangeText={setCorreo}
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="*******"
          value={contrasenia}
          onChangeText={setContrasenia}
          placeholderTextColor="#999"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
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
    marginBottom: 30,
    textTransform: 'uppercase',
  },
  label: {
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    marginTop: 24,
    backgroundColor: PRIMARY_COLOR,
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
  linkText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});