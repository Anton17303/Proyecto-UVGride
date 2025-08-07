const Payment = require('../models/pago');

// POST /api/payments
exports.createPayment = (req, res) => {
  const { userId, amount, method } = req.body;

  if (!['efectivo', 'tarjeta'].includes(method)) {
    return res.status(400).json({ error: 'Método de pago no válido' });
  }

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId y amount son obligatorios' });
  }

  // Simulación de procesamiento
  let status = 'pendiente';

  if (method === 'tarjeta') {
    // Simulamos procesamiento inmediato
    // Aquí iría la lógica con una pasarela como Stripe
    status = 'pagado';
  }

  const newPayment = Payment.create({ userId, amount, method, status });

  res.status(201).json(newPayment);
};

// GET /api/payments
exports.getAllPayments = (req, res) => {
  const allPayments = Payment.findAll();
  res.json(allPayments);
};

// GET /api/payments/:id
exports.getPaymentById = (req, res) => {
  const id = parseInt(req.params.id);
  const payment = Payment.findById(id);

  if (!payment) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  res.json(payment);
};
