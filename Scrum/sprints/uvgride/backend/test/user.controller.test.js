const Usuario = require('../src/models/Usuario');
const bcrypt = require('bcrypt');
const {
  getUserProfile,
  updateUserProfile
} = require('../src/controllers/user.controller');

jest.mock('../src/models/Usuario');
jest.mock('bcrypt');

describe('usuarioController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id_usuario: 1 }
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // 🔹 getUserProfile
  describe('getUserProfile', () => {
    it('debe devolver el perfil si el usuario existe', async () => {
      const mockUser = { id_usuario: 1, nombre: 'Ana' };
      req.params.id = '1';
      Usuario.findByPk.mockResolvedValue(mockUser);

      await getUserProfile(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('1', {
        attributes: { exclude: ['contrasenia'] }
      });
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('debe devolver 404 si el usuario no existe', async () => {
      req.params.id = '1';
      Usuario.findByPk.mockResolvedValue(null);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('debe devolver 500 si ocurre un error', async () => {
      req.params.id = '1';
      Usuario.findByPk.mockRejectedValue(new Error('DB Error'));

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener el perfil del usuario' });
    });
  });

  // 🔹 updateUserProfile
  describe('updateUserProfile', () => {
    it('debe actualizar el perfil si es el mismo usuario', async () => {
      req.params.id = '1';
      req.body = {
        nombre: 'NuevoNombre',
        preferencia_tema: 'oscuro'
      };

      Usuario.update.mockResolvedValue([1]); // 1 fila actualizada
      Usuario.findByPk.mockResolvedValue({ id_usuario: 1, nombre: 'NuevoNombre' });

      await updateUserProfile(req, res);

      expect(Usuario.update).toHaveBeenCalledWith(
        { preferencia_tema: 'oscuro' },
        { where: { id_usuario: '1' } }
      );
      expect(Usuario.update).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({
          where: { id_usuario: '1' },
          returning: true,
          individualHooks: true
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfil actualizado correctamente',
        user: { id_usuario: 1, nombre: 'NuevoNombre' }
      });
    });

    it('debe rechazar la actualización si no es el dueño del perfil', async () => {
      req.params.id = '2'; // diferente usuario
      req.user.id_usuario = 1;

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
    });

    it('debe hashear la contraseña si se proporciona', async () => {
      req.params.id = '1';
      req.user.id_usuario = 1;
      req.body = {
        contrasenia: '123456',
        preferencia_tema: 'claro'
      };

      const hashed = 'hashedpassword';
      bcrypt.hash.mockResolvedValue(hashed);

      Usuario.update
        .mockResolvedValueOnce([1]) // primer update: preferencia_tema
        .mockResolvedValueOnce([1]); // segundo update: con contraseña

      Usuario.findByPk.mockResolvedValue({ id_usuario: 1, nombre: 'User' });

      await updateUserProfile(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(req.body.contrasenia).toBe(hashed);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfil actualizado correctamente',
        user: { id_usuario: 1, nombre: 'User' }
      });
    });

    it('debe devolver 404 si no se actualizó ninguna fila', async () => {
      req.params.id = '1';
      req.user.id_usuario = 1;
      req.body = {};

      Usuario.update.mockResolvedValue([0]); // 0 filas actualizadas

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('debe devolver error 500 si ocurre un error inesperado', async () => {
      req.params.id = '1';
      req.user.id_usuario = 1;
      req.body = { nombre: 'Test' };

      Usuario.update.mockRejectedValue(new Error('DB Error'));

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar el perfil'
      });
    });
  });
});
