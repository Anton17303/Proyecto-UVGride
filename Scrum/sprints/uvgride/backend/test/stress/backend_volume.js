const { runLoadTests } = require('./backend_stress');

async function main() {
  const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
  console.log('🏁 Iniciando pruebas de volumen para el backend');
  console.log(`   Base URL: ${baseUrl}`);

  const scenarios = [
    {
      name: 'Volumen alto en endpoints públicos',
      baseUrl,
      durationSeconds: Number(process.env.BACKEND_VOLUME_PUBLIC_DURATION || 120),
      concurrency: Number(process.env.BACKEND_VOLUME_PUBLIC_CONNECTIONS || 80),
      requests: [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/api/example' },
        { method: 'GET', path: '/api/example/test' },
      ],
    },
    {
      name: 'Volumen sostenido en listado de viajes',
      baseUrl,
      durationSeconds: Number(process.env.BACKEND_VOLUME_VIAJES_DURATION || 150),
      concurrency: Number(process.env.BACKEND_VOLUME_VIAJES_CONNECTIONS || 120),
      requests: [
        { method: 'GET', path: '/api/viajes' },
        { method: 'GET', path: '/api/viajes?page=2&limit=20' },
        { method: 'GET', path: '/api/viajes?page=3&limit=50' },
      ],
    },
  ];

  await runLoadTests(scenarios);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Error durante las pruebas de volumen:', err);
    process.exitCode = 1;
  });
}

module.exports = { main };