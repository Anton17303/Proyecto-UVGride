const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login } = require('../src/controllers/auth.controller');
const Usuario = require('../src/models/Usuario');

// Mock de la respuesta de Express
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock de JWT y bcrypt
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/Usuario');

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      const req = {
        body: {
          nombre: 'Juan',
          apellido: 'Pérez',
          correo_institucional: 'juan@uvg.edu.gt',
          contrasenia: '123456',
          telefono: '12345678',
          tipo_usuario: 'conductor',
        }
      };
      const res = mockResponse();

      Usuario.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      Usuario.create.mockResolvedValue({
        id_usuario: 1,
        ...req.body,
        contrasenia: 'hashedPassword',
      });

      await register(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { correo_institucional: req.body.correo_institucional } });
      expect(Usuario.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Usuario registrado correctamente',
        usuario: expect.objectContaining({ correo_institucional: 'juan@uvg.edu.gt' })
      }));
    });

    it('debe rechazar si el correo ya está registrado', async () => {
      const req = {
        body: {
          correo_institucional: 'juan@uvg.edu.gt',
        }
      };
      const res = mockResponse();
      Usuario.findOne.mockResolvedValue({});

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El correo ya está registrado' });
    });
  });

  describe('login', () => {
    it('debe iniciar sesión exitosamente', async () => {
      const req = {
        body: {
          correo_institucional: 'juan@uvg.edu.gt',
          contrasenia: '123456',
        }
      };
      const res = mockResponse();

      const mockUser = {
        id_usuario: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        correo_institucional: 'juan@uvg.edu.gt',
        contrasenia: 'hashedPassword',
        telefono: '12345678',
        tipo_usuario: 'conductor'
      };

      Usuario.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token');

      await login(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login exitoso',
        token: 'fake-jwt-token',
        usuario: expect.objectContaining({ correo_institucional: 'juan@uvg.edu.gt' })
      }));
    });

    it('debe rechazar si el usuario no existe', async () => {
      const req = {
        body: { correo_institucional: 'noexiste@uvg.edu.gt' }
      };
      const res = mockResponse();

      Usuario.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    it('debe rechazar si la contraseña es incorrecta', async () => {
      const req = {
        body: {
          correo_institucional: 'juan@uvg.edu.gt',
          contrasenia: 'wrongpassword'
        }
      };
      const res = mockResponse();

      Usuario.findOne.mockResolvedValue({ contrasenia: 'hashedPassword' });
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });
  });
});
