const Viaje = require('../models/Viaje');

// ✅ Crear un viaje
exports.crearViaje = async (req, res) => {
  try {
    let {
      origen,
      destino,
      lat_origen,
      lon_origen,
      lat_destino,
      lon_destino,
      costo_total,
    } = req.body;

    if (!origen?.trim() || !destino?.trim() || !costo_total) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    lat_origen = lat_origen ? parseFloat(lat_origen) : null;
    lon_origen = lon_origen ? parseFloat(lon_origen) : null;
    lat_destino = lat_destino ? parseFloat(lat_destino) : null;
    lon_destino = lon_destino ? parseFloat(lon_destino) : null;

    const nuevoViaje = await Viaje.create({
      origen: origen.trim(),
      destino: destino.trim(),
      lat_origen,
      lon_origen,
      lat_destino,
      lon_destino,
      costo_total,
    });

    return res.status(201).json({
      message: 'Viaje creado correctamente',
      viaje: nuevoViaje,
    });
  } catch (error) {
    console.error('❌ Error al crear el viaje:', error);
    return res.status(500).json({ error: 'Error interno al crear el viaje' });
  }
};

exports.obtenerViajes = async (req, res) => {
  try {
    const viajes = await Viaje.findAll({
      order: [['id_viaje_maestro', 'DESC']],
    });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener los viajes:', error);
    return res.status(500).json({ error: 'Error interno al obtener los viajes' });
  }
};

exports.obtenerViajePorId = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de viaje no proporcionado' });
  }

  try {
    const viaje = await Viaje.findByPk(id);

    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    return res.json({ viaje });
  } catch (error) {
    console.error('❌ Error al obtener el viaje:', error);
    return res.status(500).json({ error: 'Error interno al obtener el viaje' });
  }
};