
const payments = [];

class Payment {
  constructor({ userId, amount, method, status }) {
    this.id = payments.length + 1;
    this.userId = userId;
    this.amount = amount;
    this.method = method; // 'efectivo' o 'tarjeta'
    this.status = status || 'pendiente'; // pendiente, pagado, fallido
    this.createdAt = new Date();
  }

  static create(data) {
    const payment = new Payment(data);
    payments.push(payment);
    return payment;
  }

  static findAll() {
    return payments;
  }

  static findById(id) {
    return payments.find(p => p.id === id);
  }
}

module.exports = Payment;
