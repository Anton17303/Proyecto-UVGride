// src/models/ViajePasajero.js
module.exports = (sequelize, DataTypes) => {
  const ViajePasajero = sequelize.define(
    'ViajePasajero',
    {
      id_viaje_maestro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      // ❌ OJO: no definimos 'estado' porque la tabla NO lo tiene
    },
    {
      tableName: 'viaje_pasajero',
      // Tu tabla tiene created_at / updated_at, así que mapeamos:
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['id_viaje_maestro', 'id_usuario'],
          name: 'viaje_pasajero_unique_idx',
        },
      ],
    }
  );

  ViajePasajero.associate = (models) => {
    if (models.Viaje) {
      ViajePasajero.belongsTo(models.Viaje, {
        foreignKey: 'id_viaje_maestro',
        targetKey: 'id_viaje_maestro',
        as: 'viaje',
      });
    }

    ViajePasajero.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario',
      targetKey: 'id_usuario',
      as: 'usuario',
    });

    // Helpers many-to-many (opcionales)
    if (models.Viaje && models.Usuario) {
      models.Viaje.belongsToMany(models.Usuario, {
        through: ViajePasajero,
        foreignKey: 'id_viaje_maestro',
        otherKey: 'id_usuario',
        as: 'pasajeros',
      });

      models.Usuario.belongsToMany(models.Viaje, {
        through: ViajePasajero,
        foreignKey: 'id_usuario',
        otherKey: 'id_viaje_maestro',
        as: 'viajes',
      });
    }
  };

  return ViajePasajero;
};