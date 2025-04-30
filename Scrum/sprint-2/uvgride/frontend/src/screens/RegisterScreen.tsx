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
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !age || !email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name, age, email, password
      });

      Alert.alert('Registrado', `Bienvenido ${res.data.user.name}`);
      navigation.navigate('Login');
    } catch (err: any) {
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
          value={name} 
          onChangeText={setName} 
          placeholder="Nombre completo" 
          placeholderTextColor="#999" 
        />

        <Text style={styles.label}>Edad</Text>
        <TextInput 
          style={styles.input} 
          value={age} 
          onChangeText={setAge} 
          placeholder="21" 
          keyboardType="numeric" 
          placeholderTextColor="#999" 
        />

        <Text style={styles.label}>Correo</Text>
        <TextInput 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          placeholder="correo@uvg.edu.gt" 
          autoCapitalize="none" 
          placeholderTextColor="#999" 
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          placeholder="*******" 
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#000' },
  title: { 
    fontSize: 32, 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 8, 
    textTransform: 'uppercase' 
  },
  label: { 
    color: '#fff', 
    marginBottom: 6, 
    marginTop: 12, 
    fontSize: 14 
  },
  input: { 
    backgroundColor: '#333', 
    color: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 16,
    marginBottom: 8 
  },
  button: { 
    marginTop: 24, 
    backgroundColor: '#fff', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});