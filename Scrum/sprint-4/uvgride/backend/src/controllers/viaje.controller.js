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

exports.actualizarViaje = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de viaje no proporcionado' });
  }

  try {
    let datosActualizacion = { ...req.body };

    // Si se actualizan las coordenadas, recalcular la distancia
    if (datosActualizacion.lat_origen && datosActualizacion.lat_destino) {
      const distancia = calcularDistancia(
        parseFloat(datosActualizacion.lat_origen),
        parseFloat(datosActualizacion.lon_origen),
        parseFloat(datosActualizacion.lat_destino),
        parseFloat(datosActualizacion.lon_destino)
      );
      datosActualizacion.distancia_km = distancia;
    }

    datosActualizacion.fecha_actualizacion = new Date();

    const [filasActualizadas] = await Viaje.update(datosActualizacion, {
      where: { id_viaje_maestro: id },
      returning: true
    });

    if (filasActualizadas === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    const viajeActualizado = await Viaje.findByPk(id);

    return res.json({
      message: 'Viaje actualizado correctamente',
      viaje: viajeActualizado
    });

  } catch (error) {
    console.error('❌ Error al actualizar el viaje:', error);
    return res.status(500).json({ error: 'Error interno al actualizar el viaje' });
  }
};

exports.eliminarViaje = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de viaje no proporcionado' });
  }

  try {
    const viaje = await Viaje.findByPk(id);

    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    await Viaje.destroy({ where: { id_viaje_maestro: id } });

    return res.json({ message: 'Viaje eliminado correctamente' });

  } catch (error) {
    console.error('❌ Error al eliminar el viaje:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el viaje' });
  }
};

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
}

// ✅ Buscar viajes cercanos (función adicional)
exports.buscarViagesCercanos = async (req, res) => {
  try {
    const { lat, lon, radio = 10 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radioKm = parseFloat(radio);

    // Calcular los límites del área de búsqueda
    const latMin = latitude - (radioKm / 111);
    const latMax = latitude + (radioKm / 111);
    const lonMin = longitude - (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));
    const lonMax = longitude + (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));

    const { Op } = require('sequelize');
    
    const viajes = await Viaje.findAll({
      where: {
        lat_origen: {
          [Op.between]: [latMin, latMax]
        },
        lon_origen: {
          [Op.between]: [lonMin, lonMax]
        },
        estado: 'pendiente'
      },
      order: [['fecha_creacion', 'DESC']]
    });

    return res.json({ viajes });

  } catch (error) {
    console.error('❌ Error al buscar viajes cercanos:', error);
    return res.status(500).json({ error: 'Error interno al buscar viajes cercanos' });
  }
};