// src/controllers/driver.controller.js
const { Usuario, Vehiculo } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/conductores
 * Lista todos los conductores que tengan ≥1 vehículo.
 * Query opcional: ?q=texto para filtrar por nombre/apellido/correo
 */
const listConductoresConVehiculo = async (req, res) => {
  try {
    const { q } = req.query;

    const whereUsuario = {
      tipo_usuario: { [Op.iLike]: 'conductor' },
    };

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      whereUsuario[Op.or] = [
        { nombre: { [Op.iLike]: term } },
        { apellido: { [Op.iLike]: term } },
        { correo_institucional: { [Op.iLike]: term } },
      ];
    }

    const conductores = await Usuario.findAll({
      where: whereUsuario,
      attributes: [
        'id_usuario',
        'nombre',
        'apellido',
        'telefono',
        'correo_institucional',
        'tipo_usuario',
      ],
      include: [
        {
          model: Vehiculo,
          as: 'vehiculos',
          required: true, // solo con al menos un vehículo
          attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
        },
      ],
      order: [['nombre', 'ASC'], ['apellido', 'ASC']],
      limit: 100, // ajusta según necesites
    });

    res.json({ data: conductores });
  } catch (err) {
    console.error('❌ Error en listConductoresConVehiculo:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * GET /api/conductores/:id
 * Perfil público de un conductor (debe tener ≥1 vehículo).
 */
const getDriverPublicProfile = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const conductor = await Usuario.findOne({
      where: {
        id_usuario: id,
        tipo_usuario: { [Op.iLike]: 'conductor' },
      },
      attributes: [
        'id_usuario',
        'nombre',
        'apellido',
        'telefono',
        'correo_institucional',
        'tipo_usuario',
      ],
      include: [
        {
          model: Vehiculo,
          as: 'vehiculos',
          required: true,
          attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
        },
      ],
      order: [[{ model: Vehiculo, as: 'vehiculos' }, 'id_vehiculo', 'DESC']],
    });

    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado o sin vehículos' });
    }

    res.json({ data: conductor });
  } catch (err) {
    console.error('❌ Error en getDriverPublicProfile:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  listConductoresConVehiculo,
  getDriverPublicProfile,
};