const { getHomeData } = require('../src/controllers/home.controller');
const Usuario = require('../src/models/Usuario');

jest.mock('../src/models/Usuario');

describe('getHomeData', () => {
  const mockRequest = () => ({
    user: {
      id_usuario: 1,
    },
  });

  const mockResponse = () => {
    const res = {};
    res.json = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver los datos del usuario y estructura esperada', async () => {
    const req = mockRequest();
    const res = mockResponse();

    const fakeUser = {
      id_usuario: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      correo_institucional: 'juan@uvg.edu.gt',
      telefono: '55555555',
      tipo_usuario: 'estudiante',
    };

    Usuario.findByPk.mockResolvedValue(fakeUser);

    await getHomeData(req, res);

    expect(Usuario.findByPk).toHaveBeenCalledWith(1, {
      attributes: ['id_usuario', 'nombre', 'apellido', 'correo_institucional', 'telefono', 'tipo_usuario'],
    });

    expect(res.json).toHaveBeenCalledWith({
      user: fakeUser,
      nearbyTrips: [],
      notifications: [],
      recentActivity: [],
      stats: {
        completedTrips: 0,
        sharedRides: 0,
        rating: 4.5,
      },
    });
  });

  it('debe manejar errores y devolver estado 500', async () => {
    const req = mockRequest();
    const res = mockResponse();

    Usuario.findByPk.mockRejectedValue(new Error('DB error'));

    await getHomeData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener datos de inicio' });
  });
});
