const LugarFavorito = require('../src/models/LugarFavorito');
const {
  crearFavorito,
  obtenerFavoritosPorUsuario,
  obtenerFavoritoPorId,
  eliminarFavorito,
} = require('../src/controllers/favorite.controller');

jest.mock('../src/models/LugarFavorito');

describe('Controlador LugarFavorito', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // 🔹 crearFavorito
  describe('crearFavorito', () => {
    it('crea un lugar favorito correctamente', async () => {
      req.body = {
        id_usuario: 1,
        nombre_lugar: 'Parque Central',
        descripcion: 'Muy bonito',
        color_hex: '#FF0000'
      };

      const mockFavorito = { id_lugar_favorito: 10, ...req.body };
      LugarFavorito.create.mockResolvedValue(mockFavorito);

      await crearFavorito(req, res);

      expect(LugarFavorito.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, favorito: mockFavorito });
    });

    it('devuelve error 400 si faltan campos requeridos', async () => {
      req.body = { descripcion: 'Sin nombre' }; // falta id_usuario, nombre_lugar, color_hex

      await crearFavorito(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'id_usuario, nombre_lugar y color_hex son requeridos',
      });
    });

    it('devuelve error 500 si falla la creación', async () => {
      req.body = {
        id_usuario: 1,
        nombre_lugar: 'Error',
        color_hex: '#123456'
      };
      LugarFavorito.create.mockRejectedValue(new Error('DB Error'));

      await crearFavorito(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al crear el lugar favorito'
      });
    });
  });

  // 🔹 obtenerFavoritosPorUsuario
  describe('obtenerFavoritosPorUsuario', () => {
    it('devuelve todos los favoritos del usuario', async () => {
      req.params = { id_usuario: 1 };
      const mockFavoritos = [{ id: 1 }, { id: 2 }];
      LugarFavorito.findAll.mockResolvedValue(mockFavoritos);

      await obtenerFavoritosPorUsuario(req, res);

      expect(LugarFavorito.findAll).toHaveBeenCalledWith({ where: { id_usuario: 1 } });
      expect(res.json).toHaveBeenCalledWith({ success: true, favoritos: mockFavoritos });
    });

    it('devuelve error 500 si falla la búsqueda', async () => {
      LugarFavorito.findAll.mockRejectedValue(new Error('DB Error'));

      await obtenerFavoritosPorUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al obtener favoritos'
      });
    });
  });

  // 🔹 obtenerFavoritoPorId
  describe('obtenerFavoritoPorId', () => {
    it('devuelve el favorito si existe', async () => {
      req.params = { id_lugar_favorito: 10 };
      const mockFavorito = { id_lugar_favorito: 10, nombre: 'Café' };
      LugarFavorito.findByPk.mockResolvedValue(mockFavorito);

      await obtenerFavoritoPorId(req, res);

      expect(LugarFavorito.findByPk).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({ success: true, favorito: mockFavorito });
    });

    it('devuelve error 404 si no se encuentra', async () => {
      req.params = { id_lugar_favorito: 99 };
      LugarFavorito.findByPk.mockResolvedValue(null);

      await obtenerFavoritoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lugar favorito no encontrado'
      });
    });

    it('devuelve error 500 si falla la búsqueda', async () => {
      LugarFavorito.findByPk.mockRejectedValue(new Error('DB Error'));

      await obtenerFavoritoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al obtener favorito por ID'
      });
    });
  });

  // 🔹 eliminarFavorito
  describe('eliminarFavorito', () => {
    it('elimina un favorito si existe', async () => {
      req.params = { id_lugar_favorito: 5 };
      LugarFavorito.destroy.mockResolvedValue(1); // 1 fila eliminada

      await eliminarFavorito(req, res);

      expect(LugarFavorito.destroy).toHaveBeenCalledWith({ where: { id_lugar_favorito: 5 } });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Lugar favorito eliminado correctamente'
      });
    });

    it('devuelve error 404 si el favorito no existe', async () => {
      LugarFavorito.destroy.mockResolvedValue(0); // Nada eliminado

      await eliminarFavorito(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lugar favorito no encontrado'
      });
    });

    it('devuelve error 500 si falla la eliminación', async () => {
      LugarFavorito.destroy.mockRejectedValue(new Error('DB Error'));

      await eliminarFavorito(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error al eliminar el lugar favorito'
      });
    });
  });
});
