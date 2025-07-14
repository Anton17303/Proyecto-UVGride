// src/models/Viaje.js
const { DataTypes } = require('sequelize');
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
  lat_origen: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lon_origen: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lat_destino: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lon_destino: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
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
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios', // nombre de la tabla de usuarios
      key: 'id'
    }
  },
  conductor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'conductores', // nombre de la tabla de conductores
      key: 'id'
    }
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Las notas no pueden exceder 500 caracteres'
      }
    }
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'La calificación mínima es 1'
      },
      max: {
        args: [5],
        msg: 'La calificación máxima es 5'
      }
    }
  }
},{
  tableName: 'viaje_maestro',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  indexes: [
    {
      fields: ['usuario_id', 'fecha_creacion']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['conductor_id']
    },
    {
      fields: ['fecha_creacion']
    }
  ]
});

// ✅ Métodos de instancia
Viaje.prototype.iniciarViaje = function() {
  this.estado = 'en_progreso';
  this.fecha_inicio = new Date();
  return this.save();
};

Viaje.prototype.completarViaje = function(calificacion = null) {
  this.estado = 'completado';
  this.fecha_fin = new Date();
  if (calificacion) {
    this.calificacion = calificacion;
  }
  return this.save();
};

Viaje.prototype.cancelarViaje = function(motivo = null) {
  this.estado = 'cancelado';
  if (motivo) {
    this.notas = this.notas ? `${this.notas}. Cancelado: ${motivo}` : `Cancelado: ${motivo}`;
  }
  return this.save();
};

// ✅ Métodos estáticos
Viaje.buscarViagesCercanos = function(lat, lon, radioKm = 10) {
  const { Op } = require('sequelize');
  
  const latMin = lat - (radioKm / 111);
  const latMax = lat + (radioKm / 111);
  const lonMin = lon - (radioKm / (111 * Math.cos(lat * Math.PI / 180)));
  const lonMax = lon + (radioKm / (111 * Math.cos(lat * Math.PI / 180)));

  return this.findAll({
    where: {
      lat_origen: {
        [Op.between]: [latMin, latMax]
      },
      lon_origen: {
        [Op.between]: [lonMin, lonMax]
      },
      estado: 'pendiente'
    }
  });
};

// ✅ Getter virtual para duración
Viaje.prototype.getDuracionMinutos = function() {
  if (this.fecha_inicio && this.fecha_fin) {
    return Math.round((this.fecha_fin - this.fecha_inicio) / (1000 * 60));
  }
  return null;
};

module.exports = Viaje;