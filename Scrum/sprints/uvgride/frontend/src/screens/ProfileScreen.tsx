import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();

  const profileOptions = [
    { title: 'Términos y Condiciones', icon: '📑' },
    { title: 'Idioma', icon: '🌐' },
    { title: 'Información', icon: 'ℹ️' },
    { title: 'Política de Privacidad', icon: '🔒' },
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
      <View style={styles.container}>
        <Text style={{ marginTop: 50, textAlign: 'center', fontSize: 16 }}>
          No hay usuario logueado.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          <Image
            source={require('../assets/default-profile.jpg')}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {user.telefono && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{user.telefono}</Text>
            </View>
          )}

          {user.tipo_usuario && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Tipo de usuario:</Text>
              <Text style={styles.infoValue}>{user.tipo_usuario}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => handleOptionPress(option.title)}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const PRIMARY_COLOR = '#4CAF50';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollContainer: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
    marginTop: 60,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#555',
  },
  editButton: {
    backgroundColor: PRIMARY_COLOR,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
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
  optionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#d9534f',
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