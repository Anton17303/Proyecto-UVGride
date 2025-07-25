const Viaje = require('../src/models/Viaje');
const viajeController = require('../src/controllers/viaje.controller');
const { Op } = require('sequelize');

jest.mock('../src/models/Viaje');

describe('Viaje Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = { status: jest.fn(() => res), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('crearViaje', () => {
    it('debe crear un viaje exitosamente', async () => {
      req.body = {
        origen: 'A', destino: 'B', costo_total: 100, id_usuario: 1
      };
      Viaje.create.mockResolvedValue({ id: 1 });

      await viajeController.crearViaje(req, res);

      expect(Viaje.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('debe retornar error 400 si faltan campos', async () => {
      req.body = { origen: '', destino: 'B' };

      await viajeController.crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Faltan datos obligatorios' });
    });
  });

  describe('obtenerViajesPorUsuario', () => {
    it('debe retornar los viajes del usuario', async () => {
      req.params.userId = 1;
      Viaje.findAll.mockResolvedValue([{ id: 1 }]);

      await viajeController.obtenerViajesPorUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith({ viajes: [{ id: 1 }] });
    });

    it('debe retornar error 400 sin userId', async () => {
      await viajeController.obtenerViajesPorUsuario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('obtenerViajes', () => {
    it('debe retornar todos los viajes', async () => {
      Viaje.findAll.mockResolvedValue([{ id: 1 }]);

      await viajeController.obtenerViajes(req, res);

      expect(res.json).toHaveBeenCalledWith({ viajes: [{ id: 1 }] });
    });
  });

  describe('obtenerViajePorId', () => {
    it('debe retornar un viaje por ID', async () => {
      req.params.id = 1;
      Viaje.findByPk.mockResolvedValue({ id: 1 });

      await viajeController.obtenerViajePorId(req, res);

      expect(res.json).toHaveBeenCalledWith({ viaje: { id: 1 } });
    });

    it('debe retornar 404 si no existe el viaje', async () => {
      req.params.id = 1;
      Viaje.findByPk.mockResolvedValue(null);

      await viajeController.obtenerViajePorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('actualizarViaje', () => {
    it('debe actualizar un viaje correctamente', async () => {
      req.params.id = 1;
      req.body = { origen: 'C' };
      Viaje.update.mockResolvedValue([1]);
      Viaje.findByPk.mockResolvedValue({ id: 1 });

      await viajeController.actualizarViaje(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String), viaje: { id: 1 } });
    });

    it('debe retornar 404 si no se actualiza ningún viaje', async () => {
      req.params.id = 1;
      Viaje.update.mockResolvedValue([0]);

      await viajeController.actualizarViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('eliminarViaje', () => {
    it('debe eliminar un viaje existente', async () => {
      req.params.id = 1;
      Viaje.findByPk.mockResolvedValue({ id: 1 });

      await viajeController.eliminarViaje(req, res);

      expect(Viaje.destroy).toHaveBeenCalledWith({ where: { id_viaje_maestro: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Viaje eliminado correctamente' });
    });

    it('debe retornar 404 si no existe el viaje', async () => {
      req.params.id = 1;
      Viaje.findByPk.mockResolvedValue(null);

      await viajeController.eliminarViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('buscarViagesCercanos', () => {
    it('debe retornar viajes dentro del radio', async () => {
      req.query = { lat: '10', lon: '10', radio: '5' };
      Viaje.findAll.mockResolvedValue([{ id: 1 }]);

      await viajeController.buscarViagesCercanos(req, res);

      expect(res.json).toHaveBeenCalledWith({ viajes: [{ id: 1 }] });
    });

    it('debe retornar 400 si faltan coordenadas', async () => {
      req.query = { lat: '', lon: '' };

      await viajeController.buscarViagesCercanos(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
