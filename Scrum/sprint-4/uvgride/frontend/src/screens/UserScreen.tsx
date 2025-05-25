import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/type.js';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Encabezado de perfil */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100' }} // imagen temporal de usuario
            style={styles.avatar}
          />
          <View>
            <Text style={styles.welcome}>Bienvenido</Text>
            <Text style={styles.username}>Dani Martínez</Text>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <TextInput
          placeholder="Busca un conductor"
          style={styles.searchInput}
          placeholderTextColor="#999"
        />

        {/* Categorías */}
        <Text style={styles.sectionTitle}>Categorías</Text>

        <View style={styles.categoriesContainer}>
          <TouchableOpacity style={styles.categoryBox}>
            {/* <Image source={require('../assets/sedan.png')} style={styles.icon} /> */}
            <Text style={styles.categoryText}>Sedán</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryBox}>
            {/* <Image source={require('../assets/suv.png')} style={styles.icon} /> */}
            <Text style={styles.categoryText}>SUV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryBox}>
            {/* <Image source={require('../assets/moto.png')} style={styles.icon} /> */}
            <Text style={styles.categoryText}>Motocicleta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryBox}>
            {/* <Image source={require('../assets/bici.png')} style={styles.icon} /> */}
            <Text style={styles.categoryText}>Bicicleta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  welcome: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 25,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
