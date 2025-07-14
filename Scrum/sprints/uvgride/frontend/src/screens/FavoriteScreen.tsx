import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
// import axios from 'axios'; ← cuando tengas el backend
// import { API_URL } from '../services/api';

type LugarFavorito = {
    id_lugar_favorito: number;
    nombre_lugar: string;
    descripcion?: string;
    color_hex?: string;
};

export default function FavoriteScreen() {
    const navigation = useNavigation();
    const { user } = useUser();
    const [favoritos, setFavoritos] = useState<LugarFavorito[]>([]);

    useEffect(() => {
        cargarFavoritos();
    }, []);

    const cargarFavoritos = async () => {
        // const res = await axios.get(`${API_URL}/api/favoritos/${user.id}`);
        // setFavoritos(res.data);

        // Mock temporal:
        setFavoritos([
            {
                id_lugar_favorito: 1,
                nombre_lugar: 'Antigua Guatemala',
                descripcion: 'Una ciudad colonial hermosa',
                color_hex: '#FF5733'
            },
            {
                id_lugar_favorito: 2,
                nombre_lugar: 'Lago de Atitlán',
                descripcion: 'Perfecto para descansar',
                color_hex: '#33FF57'
            }
        ]);
    };

    const renderItem = ({ item }: { item: LugarFavorito }) => (
        <View style={styles.card}>
            <Text style={[styles.name, { color: item.color_hex || '#333' }]}>
                {item.nombre_lugar}
            </Text>
            {item.descripcion && <Text style={styles.description}>{item.descripcion}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Lugares Favoritos</Text>

            <FlatList
                data={favoritos}
                keyExtractor={(item) => item.id_lugar_favorito.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 16 }}
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddFavoriteScreen')}
            >
                <Text style={styles.addButtonText}>+ Agregar nuevo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.backButtonText}>← Volver al menú</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#f2f2f2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    name: { fontSize: 18, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#555', marginVertical: 4 },
    coords: { fontSize: 12, color: '#777' },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 40,
        marginTop: 12,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 10,
        padding: 10,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});