const { Sequelize } = require('sequelize');

// 1) Instancia Sequelize primero (clave para evitar requires circulares)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'uvgride',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'database',
    dialect: 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
    logging: false,
    pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  }
);

// Exporta sequelize de inmediato (los modelos lo importan desde aquí)
module.exports.sequelize = sequelize;

// 2) Importa modelos (usan { sequelize } de arriba)
const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');

// 3) Asociaciones en un solo lugar
Usuario.hasMany(Vehiculo, {
  foreignKey: 'id_usuario',
  as: 'vehiculos',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Vehiculo.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// 4) Scopes útiles
Usuario.addScope('conductoresConVehiculos', {
  where: { tipo_usuario: 'Conductor' },
  include: [{ model: Vehiculo, as: 'vehiculos', required: true }],
});

// 5) Exporta modelos
module.exports.Usuario = Usuario;
module.exports.Vehiculo = Vehiculo;

// 6) Helper para probar conexión / sincronizar en dev
module.exports.initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // SOLO para desarrollo (opcional)
    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true }); // nunca uses force en prod
      console.log('🛠️  Modelos sincronizados (alter=true)');
    }
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
};