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
import { lightColors, darkColors } from '../constants/colors';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const colors = theme === 'light' ? lightColors : darkColors;

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.fallbackText, { color: colors.text }]}>
          No hay usuario logueado.
        </Text>
      </View>
    );
  }

  const esConductor = user.tipo_usuario?.toLowerCase() === 'conductor';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <Image
            source={require('../assets/default-profile.jpg')}
            style={[styles.profileImage, { borderColor: colors.primary }]}
          />
          <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: colors.text }]}>{user.email}</Text>

          <View style={styles.themeToggleContainer}>
            <Ionicons
              name={theme === 'dark' ? 'moon' : 'sunny'}
              size={20}
              color={theme === 'dark' ? colors.text : '#FFD700'}
            />
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={theme === 'dark' ? '#FFF' : '#f4f3f4'}
              style={{ marginHorizontal: 8 }}
            />
            <Text style={{ color: colors.text }}>
              {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
            </Text>
          </View>

          {user.telefono && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Teléfono:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.telefono}</Text>
            </View>
          )}

          {user.tipo_usuario && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Tipo de usuario:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.tipo_usuario}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        {esConductor && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary, marginTop: 12 }]}
            onPress={() => navigation.navigate('VehicleForm')}
          >
            <Text style={styles.editButtonText}>Registrar Vehículo</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => handleOptionPress(option.title)}
            >
              <Ionicons
                name={option.icon as any}
                size={22}
                color={colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: colors.text }}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme === 'dark' ? '#333' : '#d9534f' }]}
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
  fallbackText: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 16,
  },
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