const Viaje = require('../models/Viaje');
const { Op } = require('sequelize');

// ✅ Crear un viaje (normal o programado)
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
      id_usuario,
      es_programado = false,
      fecha_programada, // opcional para programado
    } = req.body;

    if (!origen?.trim() || !destino?.trim() || !costo_total || !id_usuario) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const viaje = await Viaje.create({
      origen: origen.trim(),
      destino: destino.trim(),
      lat_origen: lat_origen ?? null,
      lon_origen: lon_origen ?? null,
      lat_destino: lat_destino ?? null,
      lon_destino: lon_destino ?? null,
      costo_total,
      usuario_id: id_usuario,
      estado_viaje: es_programado ? 'programado' : 'pendiente',
      fecha_creacion: new Date(),
      fecha_inicio: es_programado && fecha_programada ? new Date(fecha_programada) : new Date(),
      es_programado,
      recordatorio_enviado: false,
    });

    return res.status(201).json({
      message: es_programado ? 'Viaje programado creado correctamente' : 'Viaje creado correctamente',
      viaje,
    });
  } catch (error) {
    console.error('❌ Error al crear el viaje:', error);
    return res.status(500).json({ error: 'Error interno al crear el viaje' });
  }
};

// ✅ Obtener historial de viajes de un usuario
exports.obtenerViajesPorUsuario = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'ID de usuario no proporcionado' });

  try {
    const viajes = await Viaje.findAll({
      where: { usuario_id: userId },
      order: [['fecha_inicio', 'DESC']],
      limit: 20,
      attributes: ['id_viaje_maestro', 'origen', 'destino', 'fecha_inicio', 'estado_viaje', 'costo_total', 'es_programado']
    });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener viajes por usuario:', error);
    return res.status(500).json({ error: 'Error interno al obtener viajes' });
  }
};

// ✅ Obtener viajes programados futuros de un usuario
exports.obtenerViajesProgramados = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'ID de usuario no proporcionado' });

  try {
    const ahora = new Date();
    const viajes = await Viaje.findAll({
      where: {
        usuario_id: userId,
        es_programado: true,
        fecha_inicio: { [Op.gt]: ahora },
      },
      order: [['fecha_inicio', 'ASC']],
    });

    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener viajes programados:', error);
    return res.status(500).json({ error: 'Error al obtener viajes programados' });
  }
};

// ✅ Obtener todos los viajes
exports.obtenerViajes = async (req, res) => {
  try {
    const viajes = await Viaje.findAll({ order: [['id_viaje_maestro', 'DESC']] });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener los viajes:', error);
    return res.status(500).json({ error: 'Error interno al obtener los viajes' });
  }
};

// ✅ Obtener viaje por ID
exports.obtenerViajePorId = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID de viaje no proporcionado' });

  try {
    const viaje = await Viaje.findByPk(id);
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    return res.json({ viaje });
  } catch (error) {
    console.error('❌ Error al obtener el viaje:', error);
    return res.status(500).json({ error: 'Error interno al obtener el viaje' });
  }
};

// ✅ Actualizar viaje
exports.actualizarViaje = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID de viaje no proporcionado' });

  try {
    const datos = { ...req.body, fecha_actualizacion: new Date() };
    const [filasActualizadas] = await Viaje.update(datos, {
      where: { id_viaje_maestro: id },
      returning: true,
    });

    if (filasActualizadas === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }

    const viaje = await Viaje.findByPk(id);
    return res.json({ message: 'Viaje actualizado correctamente', viaje });
  } catch (error) {
    console.error('❌ Error al actualizar el viaje:', error);
    return res.status(500).json({ error: 'Error interno al actualizar el viaje' });
  }
};

// ✅ Eliminar viaje
exports.eliminarViaje = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID de viaje no proporcionado' });

  try {
    const viaje = await Viaje.findByPk(id);
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    await Viaje.destroy({ where: { id_viaje_maestro: id } });
    return res.json({ message: 'Viaje eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar el viaje:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el viaje' });
  }
};

// ✅ Buscar viajes cercanos
exports.buscarViagesCercanos = async (req, res) => {
  try {
    const { lat, lon, radio = 10 } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Latitud y longitud son requeridas' });

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radioKm = parseFloat(radio);

    const latMin = latitude - (radioKm / 111);
    const latMax = latitude + (radioKm / 111);
    const lonMin = longitude - (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));
    const lonMax = longitude + (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));

    const viajes = await Viaje.findAll({
      where: {
        lat_origen: { [Op.between]: [latMin, latMax] },
        lon_origen: { [Op.between]: [lonMin, lonMax] },
        estado_viaje: 'pendiente'
      },
      order: [['fecha_creacion', 'DESC']]
    });

    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al buscar viajes cercanos:', error);
    return res.status(500).json({ error: 'Error interno al buscar viajes' });
  }
};