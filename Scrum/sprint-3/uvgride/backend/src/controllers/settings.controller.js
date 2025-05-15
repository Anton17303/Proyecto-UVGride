// controllers/settings.controller.js

let settings = {
  language: 'es',
  notifications: true,
  darkMode: false,
};

// GET /api/settings
exports.getSettings = (req, res) => {
  res.json(settings);
};

// PUT /api/settings
exports.updateSettings = (req, res) => {
  const updates = req.body;

  if (typeof updates !== 'object' || updates === null) {
    return res.status(400).json({ error: 'Formato inválido de configuración' });
  }

  settings = { ...settings, ...updates };

  res.json({ message: 'Configuración actualizada correctamente', settings });
};