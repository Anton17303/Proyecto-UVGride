'use strict';
module.exports = (sequelize, DataTypes) => {
  const ViajeRecurrenteGrupo = sequelize.define('ViajeRecurrenteGrupo', {
    titulo: DataTypes.STRING(120),
    origen: DataTypes.JSONB,
    destino: DataTypes.JSONB,
    mascara_semana: DataTypes.INTEGER,
    hora_local: DataTypes.TIME,
    zona_horaria: DataTypes.STRING,
    cupos: DataTypes.INTEGER,
    conductor_id: DataTypes.INTEGER,
    activo: DataTypes.BOOLEAN,
    fecha_inicio: DataTypes.DATEONLY,
    fecha_fin: DataTypes.DATEONLY,
    siguiente_instancia: DataTypes.DATE,
    notas: DataTypes.TEXT,
    creado_por: DataTypes.INTEGER
  }, {
    tableName: 'viajes_recurrentes_grupo',
    underscored: true
  });

  ViajeRecurrenteGrupo.associate = (models) => {
    ViajeRecurrenteGrupo.belongsTo(models.Grupo, { foreignKey: 'grupo_id', as: 'grupo' });
    ViajeRecurrenteGrupo.belongsTo(models.Usuario, { foreignKey: 'conductor_id', as: 'conductor' });
    ViajeRecurrenteGrupo.hasMany(models.ExcepcionViajeRecurrente, { foreignKey: 'recurrente_id', as: 'excepciones' });
  };

  return ViajeRecurrenteGrupo;
};

