const { Usuario, Vehiculo } = require('../models');

const getDriverPublicProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const conductor = await Usuario.findByPk(id, {
      attributes: ['id', 'nombre', 'foto', 'calificacion'],
      include: [
        {
          model: Vehiculo,
          attributes: ['marca', 'modelo', 'placa'],
        }
      ]
    });

    if (!conductor) return res.status(404).json({ error: "Conductor no encontrado" });

    res.json(conductor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getDriverPublicProfile
};
