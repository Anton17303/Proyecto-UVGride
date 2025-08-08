const Viaje = require('../models/Viaje');
const { Op } = require('sequelize');

const toNumberOrNull = (val) => {
  const num = Number(val);
  return val !== undefined && val !== null && !Number.isNaN(num) ? num : null;
};

// ✅ Crear un viaje
exports.crearViaje = async (req, res) => {
  try {
    const {
      origen,
      destino,
      lat_origen,
      lon_origen,
      lat_destino,
      lon_destino,
      costo_total,
      id_usuario,
      es_programado = false,
      fecha_programada,
    } = req.body;

    if (!origen?.trim() || !destino?.trim()) {
      return res.status(400).json({ error: 'Origen y destino son requeridos' });
    }
    if (id_usuario == null) {
      return res.status(400).json({ error: 'El ID de usuario es requerido' });
    }

    const _costo_total = toNumberOrNull(costo_total);
    if (_costo_total === null) {
      return res.status(400).json({ error: 'costo_total inválido o ausente' });
    }

    const _lat_origen  = toNumberOrNull(lat_origen);
    const _lon_origen  = toNumberOrNull(lon_origen);
    const _lat_destino = toNumberOrNull(lat_destino);
    const _lon_destino = toNumberOrNull(lon_destino);

    if (!es_programado) {
      if (
        _lat_origen === null || _lon_origen === null ||
        _lat_destino === null || _lon_destino === null
      ) {
        return res.status(400).json({ error: 'Coordenadas requeridas para viajes inmediatos' });
      }
    }

    let fecha_inicio = new Date();
    if (es_programado) {
      if (!fecha_programada) {
        return res.status(400).json({ error: 'fecha_programada es requerida para viajes programados' });
      }
      const parsed = new Date(fecha_programada);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'fecha_programada inválida (debe ser ISO o fecha válida)' });
      }
      if (parsed <= new Date()) {
        return res.status(400).json({ error: 'fecha_programada debe ser futura' });
      }
      fecha_inicio = parsed;
    }

    const viaje = await Viaje.create({
      origen: origen.trim(),
      destino: destino.trim(),
      lat_origen: _lat_origen,
      lon_origen: _lon_origen,
      lat_destino: _lat_destino,
      lon_destino: _lon_destino,
      costo_total: _costo_total,
      usuario_id: id_usuario,
      estado_viaje: 'pendiente',
      fecha_creacion: new Date(),
      fecha_inicio,
      es_programado: !!es_programado,
      recordatorio_enviado: false,
    });

    return res.status(201).json({
      message: es_programado
        ? 'Viaje programado creado correctamente'
        : 'Viaje creado correctamente',
      viaje,
    });
  } catch (error) {
    console.error('❌ Error al crear el viaje:', error);
    return res.status(500).json({ error: 'Error interno al crear el viaje' });
  }
};

// ✅ Historial por usuario
exports.obtenerViajesPorUsuario = async (req, res) => {
  const { userId } = req.params;
  try {
    const viajes = await Viaje.findAll({
      where: { usuario_id: userId },
      order: [['fecha_inicio', 'DESC']],
      limit: 50,
    });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener viajes por usuario:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Viajes programados futuros
exports.obtenerViajesProgramados = async (req, res) => {
  const { userId } = req.params;
  try {
    const ahora = new Date();
    const viajes = await Viaje.findAll({
      where: {
        usuario_id: userId,
        es_programado: true,
        estado_viaje: 'pendiente',
        fecha_inicio: { [Op.gt]: ahora },
      },
      order: [['fecha_inicio', 'ASC']],
    });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener viajes programados:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Buscar cercanos
exports.buscarViajesCercanos = async (req, res) => {
  try {
    const { lat, lon, radio = 10 } = req.query;
    const latitude = Number(lat);
    const longitude = Number(lon);
    const radioKm = Number(radio);
    if ([latitude, longitude, radioKm].some((n) => Number.isNaN(n))) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }
    const latMin = latitude - (radioKm / 111);
    const latMax = latitude + (radioKm / 111);
    const lonMin = longitude - (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));
    const lonMax = longitude + (radioKm / (111 * Math.cos(latitude * Math.PI / 180)));
    const viajes = await Viaje.findAll({
      where: {
        lat_origen: { [Op.between]: [latMin, latMax] },
        lon_origen: { [Op.between]: [lonMin, lonMax] },
        estado_viaje: 'pendiente',
      },
    });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al buscar viajes cercanos:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Todos los viajes
exports.obtenerViajes = async (req, res) => {
  try {
    const viajes = await Viaje.findAll({ order: [['id_viaje_maestro', 'DESC']] });
    return res.json({ viajes });
  } catch (error) {
    console.error('❌ Error al obtener viajes:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Por ID
exports.obtenerViajePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const viaje = await Viaje.findByPk(id);
    if (!viaje) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ viaje });
  } catch (error) {
    console.error('❌ Error al obtener viaje:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Actualizar
exports.actualizarViaje = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Viaje.update(req.body, { where: { id_viaje_maestro: id } });
    if (!updated) return res.status(404).json({ error: 'No encontrado' });
    const viaje = await Viaje.findByPk(id);
    return res.json({ message: 'Actualizado correctamente', viaje });
  } catch (error) {
    console.error('❌ Error al actualizar viaje:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ Eliminar
exports.eliminarViaje = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Viaje.destroy({ where: { id_viaje_maestro: id } });
    if (!deleted) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar viaje:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
};