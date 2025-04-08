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
import { API_URL } from '../services/api.ts';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      console.log("Usando API_URL:", API_URL);
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      Alert.alert('Éxito', `Bienvenido, ${res.data.user.name}`);
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

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="example@uvg.com"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="******"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subtext}>
          Al iniciar sesión, aceptas nuestros términos y condiciones.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtext: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  label: {
    color: '#fff',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});