import axios from 'axios';
import { API_URL } from './api';

export type Payment = {
  id: number;
  userId: number;
  amount: number;
  method: 'efectivo' | 'tarjeta';
  status: string;
};

export async function createPayment(payload: {
  userId: number;
  amount: number;
  method: 'efectivo' | 'tarjeta';
}) {
  const res = await axios.post(`${API_URL}/api/pagos`, payload);
  return res.data;
}

export async function getPayments() {
  const res = await axios.get(`${API_URL}/api/pagos`);
  return res.data;
}

export async function getPayment(id: number) {
  const res = await axios.get(`${API_URL}/api/pagos/${id}`);
  return res.data;
}

