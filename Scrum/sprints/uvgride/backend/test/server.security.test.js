const http = require('http');

function loadApp() {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  return require('../src/server');
}

async function startServer(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

describe('Configuración de seguridad del servidor', () => {
  let server;
  let baseUrl;

  afterEach(async () => {
    delete process.env.CORS_ORIGIN;
    jest.resetModules();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = undefined;
    }
  });

  it('deshabilita el header X-Powered-By para ocultar la tecnología usada', async () => {
    process.env.CORS_ORIGIN = 'https://allowed.example';
    const app = loadApp();
    ({ server, baseUrl } = await startServer(app));

    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('permite el acceso cuando el origen está en la lista blanca de CORS', async () => {
    process.env.CORS_ORIGIN = 'https://app.uvg.edu';
    const app = loadApp();
    ({ server, baseUrl } = await startServer(app));

    const origin = 'https://app.uvg.edu';
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: origin },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  });

  it('bloquea solicitudes desde orígenes no autorizados', async () => {
    process.env.CORS_ORIGIN = 'https://app.uvg.edu';
    const app = loadApp();
    ({ server, baseUrl } = await startServer(app));

    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://evil.attacker' },
    });

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Origin bloqueado por CORS: https://evil.attacker' });
  });
});