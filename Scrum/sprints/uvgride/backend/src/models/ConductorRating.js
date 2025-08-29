// src/models/ConductorRating.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./index'); // instancia compartida

class ConductorRating extends Model {
  /**
   * Crea o actualiza la calificación única pasajero→conductor.
   * @param {{conductorId:number, pasajeroId:number, puntuacion:number, comentario?:string}} args
   * @param {{transaction?: import('sequelize').Transaction}} options
   */
  static async rateOrUpdate({ conductorId, pasajeroId, puntuacion, comentario }, options = {}) {
    if (!Number.isInteger(conductorId) || conductorId <= 0) {
      throw new Error('conductorId inválido');
    }
    if (!Number.isInteger(pasajeroId) || pasajeroId <= 0) {
      throw new Error('pasajeroId inválido');
    }
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      throw new Error('puntuacion debe ser entero 1..5');
    }

    const tx = options.transaction ?? undefined;
    const where = { conductor_id: conductorId, pasajero_id: pasajeroId };

    const existing = await ConductorRating.findOne({ where, transaction: tx });
    if (existing) {
      await existing.update(
        {
          puntuacion,
          comentario: comentario?.toString()?.trim() || null,
        },
        { transaction: tx }
      );
      return existing;
    }

    return ConductorRating.create(
      {
        conductor_id: conductorId,
        pasajero_id: pasajeroId,
        puntuacion,
        comentario: comentario?.toString()?.trim() || null,
      },
      { transaction: tx }
    );
  }

  /**
   * Define asociaciones aquí. NO dupliques estas asociaciones en index.js.
   */
  static associate(models) {
    if (!models?.Usuario) return;

    // Alias único y explícito para el conductor objetivo
    ConductorRating.belongsTo(models.Usuario, {
      as: 'conductor_objetivo',
      foreignKey: 'conductor_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Alias pasajero (no debe repetirse en otro lugar)
    ConductorRating.belongsTo(models.Usuario, {
      as: 'pasajero',
      foreignKey: 'pasajero_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Relaciones inversas (opcionales)
    if (typeof models.Usuario.hasMany === 'function') {
      models.Usuario.hasMany(ConductorRating, {
        as: 'ratings_recibidos',
        foreignKey: 'conductor_id',
      });
      models.Usuario.hasMany(ConductorRating, {
        as: 'ratings_enviados',
        foreignKey: 'pasajero_id',
      });
    }
  }
}

ConductorRating.init(
  {
    id_conductor_rating: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conductor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuario', key: 'id_usuario' },
    },
    pasajero_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuario', key: 'id_usuario' },
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 1, max: 5 },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ConductorRating',
    tableName: 'conductor_rating',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['conductor_id', 'pasajero_id'], name: 'uq_conductor_pasajero' },
      { fields: ['conductor_id'], name: 'idx_conductor_rating_conductor' },
      { fields: ['pasajero_id'], name: 'idx_conductor_rating_pasajero' },
    ],
  }
);

module.exports = ConductorRating;