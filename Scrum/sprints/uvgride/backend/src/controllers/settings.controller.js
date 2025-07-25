let settings = {
  language: 'es',
  notifications: true,
  darkMode: false,
};

const defaultSettings = { ...settings }; // Copia para restaurar

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

// 👇 Exporta una función para resetear las configuraciones (usada en test)
exports._resetSettings = () => {
  settings = { ...defaultSettings };
};
