'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcepcionViajeRecurrente = sequelize.define('ExcepcionViajeRecurrente', {
    recurrente_id: DataTypes.INTEGER,
    fecha: DataTypes.DATEONLY,
    accion: DataTypes.ENUM('omitir','cambiar_hora'),
    nueva_hora_local: DataTypes.TIME,
    nota: DataTypes.TEXT
  }, {
    tableName: 'excepciones_viaje_recurrente',
    underscored: true
  });

  ExcepcionViajeRecurrente.associate = (models) => {
    ExcepcionViajeRecurrente.belongsTo(models.ViajeRecurrenteGrupo, { foreignKey: 'recurrente_id', as: 'recurrente' });
  };

  return ExcepcionViajeRecurrente;
};
