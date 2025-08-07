const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('./index');

const Viaje = sequelize.define('viaje_maestro', {
  id_viaje_maestro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  origen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat_origen: DataTypes.DECIMAL(9, 6),
  lon_origen: DataTypes.DECIMAL(9, 6),
  lat_destino: DataTypes.DECIMAL(9, 6),
  lon_destino: DataTypes.DECIMAL(9, 6),
  hora_solicitud: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado_viaje: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'usuario',
      key: 'id_usuario',
    },
  },
  conductor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'usuario',
      key: 'id_usuario',
    },
  },
  notas: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500],
    },
  },
  calificacion: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  },
  // Nuevos campos para viajes programados
  es_programado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  recordatorio_enviado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'viaje_maestro',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    { fields: ['usuario_id'] },
    { fields: ['conductor_id'] },
    { fields: ['estado_viaje'] },
    { fields: ['fecha_creacion'] },
  ]
});

// Métodos de instancia
Viaje.prototype.iniciarViaje = function () {
  this.estado_viaje = 'en_progreso';
  this.fecha_inicio = new Date();
  return this.save();
};

Viaje.prototype.completarViaje = function (calificacion = null) {
  this.estado_viaje = 'completado';
  this.fecha_fin = new Date();
  if (calificacion) this.calificacion = calificacion;
  return this.save();
};

Viaje.prototype.cancelarViaje = function (motivo = null) {
  this.estado_viaje = 'cancelado';
  if (motivo) {
    this.notas = this.notas ? `${this.notas}. Cancelado: ${motivo}` : `Cancelado: ${motivo}`;
  }
  return this.save();
};

Viaje.prototype.getDuracionMinutos = function () {
  if (this.fecha_inicio && this.fecha_fin) {
    return Math.round((this.fecha_fin - this.fecha_inicio) / (1000 * 60));
  }
  return null;
};

// Método estático para buscar viajes cercanos
Viaje.buscarViagesCercanos = function (lat, lon, radioKm = 10) {
  const latMin = lat - (radioKm / 111);
  const latMax = lat + (radioKm / 111);
  const lonMin = lon - (radioKm / (111 * Math.cos(lat * Math.PI / 180)));
  const lonMax = lon + (radioKm / (111 * Math.cos(lat * Math.PI / 180)));

  return this.findAll({
    where: {
      lat_origen: { [Op.between]: [latMin, latMax] },
      lon_origen: { [Op.between]: [lonMin, lonMax] },
      estado_viaje: 'pendiente',
    },
  });
};

module.exports = Viaje;