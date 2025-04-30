import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Datos del usuario
  const user = {
    name: 'Jiara Martins',
    rating: 4.9,
    //photo: require('../assets/default-profile.jpg'),
  };

  const profileOptions = [
    { title: 'Términos y Condiciones', icon: '📑' },
    { title: 'Idioma', icon: '🌐' },
    { title: 'Información', icon: 'ℹ️' },
    { title: 'Política de Privacidad', icon: '🔒' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Sección superior - Foto y nombre */}
        <View style={styles.profileHeader}>
          <Image source={user.photo} style={styles.profileImage} />
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{user.rating}</Text>
            <Text style={styles.ratingIcon}>⭐</Text>
          </View>
        </View>

        {/* Botón Editar Perfil */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>EDITAR PERFIL</Text>
        </TouchableOpacity>

        {/* Opciones de perfil */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.optionItem}
              onPress={() => console.log(option.title)}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6200ee',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  ratingIcon: {
    fontSize: 20,
  },
  editButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});