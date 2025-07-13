module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define('Categoria', {
    id_categoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icono: {
      type: DataTypes.STRING, // URL o nombre de imagen/icono
      allowNull: true,
    },
  }, {
    tableName: 'categorias',
    timestamps: false,
  });

  return Categoria;
};
