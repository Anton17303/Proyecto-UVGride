const { Sequelize } = require('sequelize');

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

module.exports.sequelize = sequelize;

const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const GrupoViaje = require('./GrupoViaje');
const GrupoMiembro = require('./GrupoMiembro');

let Viaje = null;
try {
  Viaje = require('./Viaje');
} catch (e) {
  Viaje = null;
}

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

if (Viaje) {
  GrupoViaje.belongsTo(Viaje, {
    as: 'viaje',
    foreignKey: 'id_viaje_maestro',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

GrupoViaje.hasMany(GrupoMiembro, {
  as: 'miembros',
  foreignKey: 'id_grupo',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
GrupoMiembro.belongsTo(GrupoViaje, {
  as: 'grupo',
  foreignKey: 'id_grupo',
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

Usuario.addScope('conductoresConVehiculos', {
  where: { tipo_usuario: 'Conductor' },
  include: [{ model: Vehiculo, as: 'vehiculos', required: true }],
});

module.exports.Usuario = Usuario;
module.exports.Vehiculo = Vehiculo;
module.exports.GrupoViaje = GrupoViaje;
module.exports.GrupoMiembro = GrupoMiembro;
if (Viaje) module.exports.Viaje = Viaje;

module.exports.initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('🛠️  Modelos sincronizados (alter=true)');
    }
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    throw error;
  }
};