// src/models/index.js
const { Sequelize, Op } = require('sequelize');

/* ======================= Sequelize ======================= */
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

/* Export temprano para romper ciclos */
module.exports.sequelize = sequelize;

/* ======================= Modelos ======================= */
const Usuario = require('./Usuario');       // usa { sequelize } desde este mismo index
const Vehiculo = require('./Vehiculo');
const GrupoViaje = require('./GrupoViaje');
const GrupoMiembro = require('./GrupoMiembro');

// Viaje es opcional
let Viaje = null;
try {
  Viaje = require('./Viaje');
} catch {
  Viaje = null;
}

/* ======================= Asociaciones ======================= */
// Usuario ↔ Vehiculo
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

// GrupoViaje ↔ Usuario (conductor)
GrupoViaje.belongsTo(Usuario, {
  as: 'conductor',
  foreignKey: 'conductor_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Usuario.hasMany(GrupoViaje, {
  as: 'grupos_creados',
  foreignKey: 'conductor_id',
});

// GrupoViaje ↔ Viaje (opcional)
if (Viaje) {
  GrupoViaje.belongsTo(Viaje, {
    as: 'viaje',
    foreignKey: 'id_viaje_maestro',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // (Opcional) relaciones útiles si luego las necesitas:
  // Viaje.belongsTo(Usuario, { as: 'conductor', foreignKey: 'conductor_id' });
  // Usuario.hasMany(Viaje, { as: 'viajes_como_conductor', foreignKey: 'conductor_id' });
}

// GrupoViaje ↔ GrupoMiembro ↔ Usuario
GrupoViaje.hasMany(GrupoMiembro, {
  as: 'miembros',
  foreignKey: 'id_grupo',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
GrupoMiembro.belongsTo(GrupoViaje, {
  as: 'grupo',
  foreignKey: 'id_grupo',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

GrupoMiembro.belongsTo(Usuario, {
  as: 'usuario',
  foreignKey: 'id_usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Usuario.hasMany(GrupoMiembro, {
  as: 'grupos_participa',
  foreignKey: 'id_usuario',
});

/* ======================= Scopes útiles ======================= */
Usuario.addScope('conductoresConVehiculos', {
  where: { tipo_usuario: { [Op.iLike]: 'conductor' } },
  include: [{ model: Vehiculo, as: 'vehiculos', required: true }],
});

/* ======================= Exports ======================= */
module.exports.Usuario = Usuario;
module.exports.Vehiculo = Vehiculo;
module.exports.GrupoViaje = GrupoViaje;
module.exports.GrupoMiembro = GrupoMiembro;
if (Viaje) module.exports.Viaje = Viaje;

// (Opcional) exportar Op si quieres usarlo desde ../models en vez de 'sequelize'
module.exports.Op = Op;

/* ======================= Init DB ======================= */
module.exports.initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true }); // no uses force en prod
      console.log('🛠️  Modelos sincronizados (alter=true)');
    }
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
};