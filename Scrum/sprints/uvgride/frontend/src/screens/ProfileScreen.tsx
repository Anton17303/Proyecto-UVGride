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
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Switch } from 'react-native';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useUser();
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#121212' : '#f0f2f5' 
    },
    scrollContainer: { 
      paddingBottom: 40 
    },
    profileCard: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
      alignItems: 'center',
      paddingVertical: 32,
      marginHorizontal: 20,
      marginTop: 60,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.1 : 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    text: {
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    button: {
      backgroundColor: isDarkMode ? '#333' : '#4CAF50',
    },
  });

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
      <View style={dynamicStyles.container}>
        <Text style={{ marginTop: 50, textAlign: 'center', color: isDarkMode ? '#FFF' : '#000' }}>
          No hay usuario logueado.
        </Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContainer}>
        <View style={dynamicStyles.profileCard}>
          <Image
            source={require('../assets/default-profile.jpg')}
            style={styles.profileImage}
          />
          <Text style={[styles.userName, dynamicStyles.text]}>{user.name}</Text>
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
            <Text style={dynamicStyles.text}>
              {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </Text>
          </View>

          {user.telefono && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#AAA' : '#888' }]}>Teléfono:</Text>
              <Text style={[styles.infoValue, dynamicStyles.text]}>{user.telefono}</Text>
            </View>
          )}

          {user.tipo_usuario && (
            <View style={styles.infoContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#AAA' : '#888' }]}>Tipo de usuario:</Text>
              <Text style={[styles.infoValue, dynamicStyles.text]}>{user.tipo_usuario}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editButton, dynamicStyles.button]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <View style={[styles.optionsContainer, { 
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
          shadowOpacity: isDarkMode ? 0.1 : 0.06,
        }]}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => handleOptionPress(option.title)}
            >
              <Ionicons name={option.icon} 
                size={22} 
                color={isDarkMode ? '#4CAF50' : '#333'} 
                style={{ marginRight: 12 }}/>
              <Text style={dynamicStyles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { 
            backgroundColor: isDarkMode ? '#333' : '#d9534f' 
          }]} onPress={handleLogout}>
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