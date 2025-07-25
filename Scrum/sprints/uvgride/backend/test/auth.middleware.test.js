const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/controllers/auth.middleware');

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'testsecret';
  });

  it('debe permitir el acceso si el token es válido', async () => {
    const mockToken = 'validtoken';
    const mockDecoded = { id: '123', role: 'user' };

    req.header.mockReturnValue(`Bearer ${mockToken}`);
    jwt.verify.mockReturnValue(mockDecoded);

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
  });

  it('debe rechazar el acceso si no se proporciona token', async () => {
    req.header.mockReturnValue(null);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso no autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar el acceso si el token es inválido', async () => {
    const invalidToken = 'invalidtoken';
    req.header.mockReturnValue(`Bearer ${invalidToken}`);
    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido');
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });
});
