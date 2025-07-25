const { updateUserProfile } = require('../src/controllers/user.controller');
const bcrypt = require('bcryptjs');
const Usuario = require('../src/models/Usuario');

jest.mock('bcryptjs');
jest.mock('../src/models/Usuario');

describe('usuarioController › updateUserProfile', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: {
        contrasenia: '123456',
        preferencia_tema: 'oscuro'
      },
      user: { id_usuario: 1 }
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  it('debe hashear la contraseña si se proporciona', async () => {
    const hashed = 'hashed123';
    bcrypt.hash.mockResolvedValue(hashed);

    Usuario.update.mockResolvedValue([1]);
    Usuario.findByPk.mockResolvedValue({ id_usuario: 1, nombre: 'Test', correo: 'a@b.com' });

    await updateUserProfile(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(req.body.contrasenia).toBe(hashed);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Perfil actualizado correctamente'
    }));
  });
});
