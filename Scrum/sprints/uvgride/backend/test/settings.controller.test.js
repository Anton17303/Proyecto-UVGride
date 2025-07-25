const {
  getSettings,
  updateSettings,
  _resetSettings
} = require('../src/controllers/settingsController');

describe('settingsController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    _resetSettings(); // restaurar valores originales antes de cada prueba
    jest.clearAllMocks();
  });

  // 🔹 GET /api/settings
  it('debe retornar la configuración actual', () => {
    getSettings(req, res);

    expect(res.json).toHaveBeenCalledWith({
      language: 'es',
      notifications: true,
      darkMode: false
    });
  });

  // 🔹 PUT /api/settings (actualización válida)
  it('debe actualizar correctamente la configuración', () => {
    req.body = {
      darkMode: true,
      language: 'en'
    };

    updateSettings(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Configuración actualizada correctamente',
      settings: {
        language: 'en',
        notifications: true,
        darkMode: true
      }
    });
  });

  // 🔹 PUT /api/settings (body no es objeto)
  it('debe devolver error 400 si el body no es un objeto', () => {
    req.body = null;

    updateSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Formato inválido de configuración'
    });
  });

  // 🔹 PUT /api/settings (body es string)
  it('debe devolver error 400 si el body es un string', () => {
    req.body = "no es un objeto";

    updateSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Formato inválido de configuración'
    });
  });
});
