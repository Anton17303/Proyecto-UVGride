// src/models/index.js
const { Sequelize, Op, DataTypes } = require('sequelize');

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

// Export temprano para evitar ciclos
module.exports.sequelize = sequelize;

/* ======================= Modelos base ======================= */
const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const GrupoViaje = require('./GrupoViaje');
const GrupoMiembro = require('./GrupoMiembro');
// const Logro = require('./Logro');
// const UsuarioLogro = require('./UsuarioLogro');

/* ======================= Modelos opcionales ======================= */
let Viaje = null;
try {
  Viaje = require('./Viaje'); // puede no existir
} catch {
  Viaje = null;
}

let ViajePasajero = null;
try {
  // ⚠️ El archivo debe llamarse exactamente 'ViajePasajero.js'
  const factory = require('./ViajePasajero');
  ViajePasajero = typeof factory === 'function' ? factory(sequelize, DataTypes) : factory;
} catch {
  ViajePasajero = null;
}

let ConductorRating = null;
try {
  ConductorRating = require('./ConductorRating'); // este modelo define .associate(models)
} catch {
  ConductorRating = null;
}

/* ======================= Asociaciones explícitas ======================= */
// Logros
// Logro.hasMany(UsuarioLogro, { foreignKey: 'id_logro', as: 'usuarios' });
// UsuarioLogro.belongsTo(Logro, { foreignKey: 'id_logro', as: 'logro' });


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

// GrupoViaje ↔ Usuario (conductor del grupo)
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

/* ======================= Registrar modelos y associate() ======================= */
// const { Usuario } = module.exports; // ya exportado abajo
// Usuario.hasMany(UsuarioLogro, { foreignKey: 'id_usuario', as: 'logros' });
// UsuarioLogro.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

const models = {
  Usuario,
  Vehiculo,
  GrupoViaje,
  GrupoMiembro,
};
if (Viaje) models.Viaje = Viaje;
if (ViajePasajero) models.ViajePasajero = ViajePasajero;
if (ConductorRating) models.ConductorRating = ConductorRating;

// ⚠️ Importante: NO volver a definir aquí las asociaciones de ConductorRating.
// Deja que ConductorRating.associate(models) las cree una sola vez.
Object.values(models).forEach((mdl) => {
  if (mdl && typeof mdl.associate === 'function') {
    mdl.associate(models);
  }
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
if (ViajePasajero) module.exports.ViajePasajero = ViajePasajero;
if (ConductorRating) module.exports.ConductorRating = ConductorRating;
module.exports.Op = Op;
// module.exports.Logro = Logro;
// module.exports.UsuarioLogro = UsuarioLogro;

/* ======================= Init DB ======================= */
module.exports.initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true }); // en prod usa migraciones
      console.log('🛠️  Modelos sincronizados (alter=true)');
    }
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
};