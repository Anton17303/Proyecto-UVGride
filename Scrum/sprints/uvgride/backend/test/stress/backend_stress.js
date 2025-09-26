const http = require('http');
const https = require('https');
const { URL } = require('url');
const { performance } = require('perf_hooks');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1)));
  return sorted[index];
}

function httpRequest(url, options = {}) {
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(
      target,
      {
        method: options.method || 'GET',
        headers: options.headers,
        timeout: options.timeout || 30000,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            ok: response.statusCode >= 200 && response.statusCode < 300,
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy(new Error('timeout'));
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function runScenario({ name, baseUrl, requests, durationSeconds, concurrency }) {
  console.log(`\n🚀 Escenario: ${name}`);
  console.log(`   Concurrencia: ${concurrency} | Duración: ${durationSeconds}s`);

  const latencies = [];
  let totalRequests = 0;
  let totalErrors = 0;

  const endAt = Date.now() + durationSeconds * 1000;
  const reqWaitMs = Number(process.env.BACKEND_REQUEST_PAUSE_MS || 0);

  async function worker(id) {
    let iteration = 0;
    while (Date.now() < endAt) {
      for (const req of requests) {
        const url = `${baseUrl}${req.path}`;
        const init = {
          method: req.method,
          headers: req.headers,
          body: req.body,
          timeout: req.timeout || 30000,
        };

        const start = performance.now();
        try {
          const response = await httpRequest(url, init);
          const latency = performance.now() - start;
          latencies.push(latency);
          totalRequests += 1;
          const allowedStatuses = req.allowedStatuses || [];
          if (!response.ok && !allowedStatuses.includes(response.status)) {
            totalErrors += 1;
          }
        } catch (error) {
          totalErrors += 1;
          console.warn(`   ⚠️  Error en ${url}: ${error.message}`);
        }
      }

      iteration += 1;
      if (iteration % 10 === 0) {
        console.log(`   Worker ${id}: ${iteration} iteraciones completadas`);
      }
      if (reqWaitMs > 0) {
        await sleep(reqWaitMs);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));

  const avgLatency = latencies.reduce((acc, cur) => acc + cur, 0) / (latencies.length || 1);

  console.log(`✅ Resultados escenario: ${name}`);
  console.table({
    peticiones: totalRequests,
    errores: totalErrors,
    'latencia media (ms)': avgLatency.toFixed(2),
    'p95 (ms)': percentile(latencies, 95).toFixed(2),
    'p99 (ms)': percentile(latencies, 99).toFixed(2),
  });
}

async function main() {
  const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
  console.log('🏁 Iniciando pruebas de estrés para el backend');
  console.log(`   Base URL: ${baseUrl}`);

  const scenarios = [
    {
      name: 'Salud y rutas públicas',
      baseUrl,
      durationSeconds: Number(process.env.BACKEND_SMOKE_DURATION || 60),
      concurrency: Number(process.env.BACKEND_SMOKE_CONNECTIONS || 20),
      requests: [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/api/example' },
        { method: 'GET', path: '/api/example/test' },
      ],
    },
    {
      name: 'Listado de viajes públicos',
      baseUrl,
      durationSeconds: Number(process.env.BACKEND_VIAJES_DURATION || 60),
      concurrency: Number(process.env.BACKEND_VIAJES_CONNECTIONS || 30),
      requests: [
        { method: 'GET', path: '/api/viajes' },
        { method: 'GET', path: '/api/viajes?page=1&limit=10' },
      ],
    },
  ];

  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  console.log('\n🏁 Pruebas de estrés finalizadas.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Error durante las pruebas de estrés:', err);
    process.exitCode = 1;
  });
}

module.exports = { main };