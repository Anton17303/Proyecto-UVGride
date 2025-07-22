import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const profileOptions = [
    { title: 'Términos y Condiciones', icon: 'document-text-outline' },
    { title: 'Idioma', icon: 'language-outline' },
    { title: 'Información', icon: 'information-circle-outline' },
    { title: 'Política de Privacidad', icon: 'lock-closed-outline' },
  ];

  const handleOptionPress = (option: string) => {
    Alert.alert(option, `Aquí se mostrará la información de: ${option}`);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        style: 'destructive',
        onPress: () => {
          setUser(null);
          navigation.navigate('Login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f0f2f5' }]}>
        <Text style={{ marginTop: 50, textAlign: 'center', color: isDarkMode ? '#FFF' : '#000' }}>
          No hay usuario logueado.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f0f2f5' }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]}>
          <Image
            source={require('../assets/default-profile.jpg')}
            style={[styles.profileImage, { borderColor: '#4CAF50' }]}
          />
          <Text style={[styles.userName, { color: isDarkMode ? '#FFF' : '#333' }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: isDarkMode ? '#AAA' : '#666' }]}>{user.email}</Text>

          <View style={styles.themeToggleContainer}>
            <Ionicons
              name={isDarkMode ? 'moon' : 'sunny'}
              size={20}
              color={isDarkMode ? '#FFF' : '#FFD700'}
            />
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={isDarkMode ? '#FFF' : '#f4f3f4'}
              style={{ marginHorizontal: 8 }}
            />
            <Text style={{ color: isDarkMode ? '#FFF' : '#333' }}>
              {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </Text>
          </View>

          {user.telefono && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#AAA' : '#888' }]}>Teléfono:</Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? '#FFF' : '#333' }]}>
                {user.telefono}
              </Text>
            </View>
          )}

          {user.tipo_usuario && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#AAA' : '#888' }]}>
                Tipo de usuario:
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? '#FFF' : '#333' }]}>
                {user.tipo_usuario}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.optionsContainer,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
              shadowOpacity: isDarkMode ? 0.1 : 0.06,
            },
          ]}
        >
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => handleOptionPress(option.title)}
            >
              <Ionicons
                name={option.icon as any}
                size={22}
                color={isDarkMode ? '#4CAF50' : '#333'}
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: isDarkMode ? '#FFF' : '#333' }}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: isDarkMode ? '#333' : '#d9534f' },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
    marginTop: 60,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
  },
  editButton: {
    marginTop: 20,
    marginHorizontal: 60,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    borderRadius: 12,
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 60,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});