// ==== Mocks ARRIBA del todo (antes de cualquier require) ====
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'fake-jwt-token') }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));

// OJO: este path debe coincidir con el que usa tu controller: require('../models/Usuario')
jest.mock('../src/models/Usuario', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

// Ahora sí importamos dependencias y el SUT
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../src/models/Usuario');
const { register, login } = require('../src/controllers/auth.controller');

// Helper de respuesta estilo Express
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Auth Controller (unit, sin DB)', () => {
  it('register: crea usuario nuevo y responde 201', async () => {
    const req = {
      body: {
        nombre: 'Juan',
        apellido: 'Pérez',
        correo_institucional: 'juan@uvg.edu.gt',
        contrasenia: '123456',
        telefono: '12345678',
        tipo_usuario: 'conductor'
      }
    };
    const res = mockResponse();

    Usuario.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Usuario.create.mockResolvedValue({
      id_usuario: 1,
      ...req.body,
      contrasenia: 'hashedPassword'
    });

    await register(req, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: { correo_institucional: req.body.correo_institucional }
    });
    expect(Usuario.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Usuario registrado correctamente',
      usuario: expect.objectContaining({ correo_institucional: 'juan@uvg.edu.gt' })
    }));
  });

  it('register: rechaza correo duplicado (400)', async () => {
    const req = { body: { correo_institucional: 'juan@uvg.edu.gt' } };
    const res = mockResponse();

    Usuario.findOne.mockResolvedValue({ id_usuario: 99 });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El correo ya está registrado' });
  });

  it('login: credenciales válidas → devuelve token', async () => {
    const req = { body: { correo_institucional: 'juan@uvg.edu.gt', contrasenia: '123456' } };
    const res = mockResponse();

    Usuario.findOne.mockResolvedValue({
      id_usuario: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      correo_institucional: 'juan@uvg.edu.gt',
      contrasenia: 'hashedPassword',
      telefono: '12345678',
      tipo_usuario: 'conductor'
    });
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

  it('login: usuario no existe → 401', async () => {
    const req = { body: { correo_institucional: 'no@uvg.edu.gt', contrasenia: 'x' } };
    const res = mockResponse();

    Usuario.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });

  it('login: contraseña incorrecta → 401', async () => {
    const req = { body: { correo_institucional: 'juan@uvg.edu.gt', contrasenia: 'wrong' } };
    const res = mockResponse();

    Usuario.findOne.mockResolvedValue({ contrasenia: 'hashedPassword' });
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });
});
