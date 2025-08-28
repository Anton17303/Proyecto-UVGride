import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createPayment } from '../services/payments';
import { useUser } from '../context/UserContext';

export default function PaymentScreen() {
  const { user } = useUser();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }
    const value = parseFloat(amount);
    if (isNaN(value)) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }
    setLoading(true);
    try {
      const payment = await createPayment({
        userId: user.id,
        amount: value,
        method,
      });
      Alert.alert('Pago creado', `Estado: ${payment.status}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Monto</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0.00"
      />
      <Text style={styles.label}>Método de pago</Text>
      <Picker selectedValue={method} onValueChange={v => setMethod(v)} style={styles.picker}>
        <Picker.Item label="Efectivo" value="efectivo" />
        <Picker.Item label="Tarjeta" value="tarjeta" />
      </Picker>
      <Button title={loading ? 'Procesando...' : 'Pagar'} onPress={handlePay} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    marginBottom: 24,
  },
});

