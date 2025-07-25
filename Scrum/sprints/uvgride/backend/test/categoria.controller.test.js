const Categoria = require('../src/models/Categoria');
const { getHomeData } = require('../src/controllers/categoria.controller');

jest.mock('../src/models/Categoria', () => ({
  findAll: jest.fn()
}));

describe('getHomeData', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        nombre: 'Ana',
        apellido: 'López',
        correo_institucional: 'ana@uvg.edu.gt'
      }
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    jest.clearAllMocks();
  });

  it('debe devolver las categorías y los datos del usuario', async () => {
    const mockCategorias = [
      { id: 1, nombre: 'Tecnología' },
      { id: 2, nombre: 'Arte' }
    ];

    Categoria.findAll.mockResolvedValue(mockCategorias);

    await getHomeData(req, res);

    expect(Categoria.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      usuario: {
        nombre: 'Ana',
        apellido: 'López',
        correo: 'ana@uvg.edu.gt'
      },
      categorias: mockCategorias
    });
  });

  it('debe devolver error 500 si ocurre una excepción', async () => {
    Categoria.findAll.mockRejectedValue(new Error('DB Error'));

    await getHomeData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener datos de inicio'
    });
  });
});