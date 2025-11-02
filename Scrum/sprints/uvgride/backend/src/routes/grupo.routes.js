// src/routes/grupo.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/grupo.controller');

/* Helpers */
const isNilOrEmpty = (v) => v === undefined || v === null || v === '';
const toNumber = (v) => (isNilOrEmpty(v) ? NaN : Number(v));
const isPosInt = (v) => Number.isInteger(toNumber(v)) && toNumber(v) > 0;

const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'on' || s === 'yes' || s === 'si' || s === 'sí';
};

const toIntArray = (v) => {
  if (Array.isArray(v)) return v.map(toNumber).filter((n) => Number.isInteger(n) && n > 0);
  if (isNilOrEmpty(v)) return [];
  // soporta "1,2,3" o "1 2 3"
  const parts = String(v).split(/[,\s]+/).map(toNumber);
  return parts.filter((n) => Number.isInteger(n) && n > 0);
};

/* Normalizador de payload */
const normalizeBody = (req, _res, next) => {
  const b = { ...(req.body || {}) };

  // destino
  if (isNilOrEmpty(b.destino) && !isNilOrEmpty(b.destino_nombre)) {
    b.destino = String(b.destino_nombre).trim();
  }
  if (!isNilOrEmpty(b.destino)) {
    b.destino = String(b.destino).trim();
  }

  // capacidad_total (alias cupos_totales)
  const rawCap =
    !isNilOrEmpty(b.capacidad_total) ? b.capacidad_total : b.cupos_totales;
  b.capacidad_total = isNilOrEmpty(rawCap) ? undefined : toNumber(rawCap);

  // precio / costo
  const rawPrecio =
    !isNilOrEmpty(b.precio_base) ? b.precio_base : b.costo_estimado;
  if (!isNilOrEmpty(rawPrecio)) {
    const n = toNumber(rawPrecio);
    b.precio_base = n;
    b.costo_estimado = n; // mantener para el controller
  }

  // fecha_salida (string ISO opcional)
  if (isNilOrEmpty(b.fecha_salida)) delete b.fecha_salida;

  // 🔁 NUEVO: es_recurrente y miembros_designados
  if (!isNilOrEmpty(b.es_recurrente)) {
    b.es_recurrente = toBool(b.es_recurrente);
  }
  if (!isNilOrEmpty(b.miembros_designados)) {
    const arr = Array.from(new Set(toIntArray(b.miembros_designados)));
    b.miembros_designados = arr;
  }

  // limpiar alias que ya mapeamos
  delete b.destino_nombre;
  delete b.cupos_totales;

  req.body = b;
  next();
};

/* Validadores */
const validateCrearGrupo = (req, res, next) => {
  const { conductor_id, destino, capacidad_total, fecha_salida, precio_base, es_recurrente, miembros_designados } =
    req.body || {};

  if (!isPosInt(conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }

  if (!destino || !String(destino).trim()) {
    return res.status(400).json({ error: 'destino es requerido' });
  }

  if (!Number.isInteger(capacidad_total) || capacidad_total <= 0) {
    return res
      .status(400)
      .json({ error: 'capacidad_total debe ser un entero > 0' });
  }

  if (!isNilOrEmpty(fecha_salida)) {
    const d = new Date(fecha_salida);
    if (Number.isNaN(d.getTime())) {
      return res
        .status(400)
        .json({ error: 'fecha_salida inválida (usar ISO o fecha válida)' });
    }
  }

  if (!isNilOrEmpty(precio_base)) {
    const n = toNumber(precio_base);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'precio_base inválido' });
    }
  }

  // 🔁 NUEVO: validar que designados no sobrepasen capacidad (1 = conductor)
  if (Array.isArray(miembros_designados) && 1 + miembros_designados.length > capacidad_total) {
    return res.status(400).json({ error: 'Los miembros designados exceden la capacidad total' });
  }

  // es_recurrente es opcional; si viene, debe ser boolean/string booleana (ya normalizado)
  if (!isNilOrEmpty(es_recurrente) && typeof es_recurrente !== 'boolean') {
    return res.status(400).json({ error: 'es_recurrente inválido' });
  }

  next();
};

const validateIdParam = (req, res, next, id) => {
  if (!isPosInt(id)) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  req.grupoId = Number(id);
  next();
};

const validateJoin = (req, res, next) => {
  const { id_usuario, monto_acordado } = req.body || {};
  if (!isPosInt(id_usuario)) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }
  if (!isNilOrEmpty(monto_acordado)) {
    const n = toNumber(monto_acordado);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'monto_acordado inválido' });
    }
  }
  next();
};

const validateLeave = (req, res, next) => {
  const { id_usuario } = req.body || {};
  if (!isPosInt(id_usuario)) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }
  next();
};

const validateCerrar = (req, res, next) => {
  const { conductor_id, estado } = req.body || {};
  if (!isPosInt(conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }
  if (estado && !['cerrado', 'cancelado', 'finalizado'].includes(String(estado))) {
    return res
      .status(400)
      .json({ error: 'estado inválido (cerrado|cancelado|finalizado)' });
  }
  next();
};

const validateEliminar = (req, res, next) => { // 🔁 NUEVO
  const { conductor_id } = req.body || {};
  if (!isPosInt(conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }
  next();
};

/* Calificaciones (solo se usan los GET aquí; el POST ahora vive en /api/conductores/:id/calificar) */
const validatePaginate = (req, _res, next) => {
  const limit = toNumber(req.query.limit ?? 10);
  const offset = toNumber(req.query.offset ?? 0);
  req.query.limit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  req.query.offset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  next();
};

/* Params */
router.param('id', validateIdParam);

/* Rutas base de grupos */
router.post('/', normalizeBody, validateCrearGrupo, ctrl.crearGrupo);
router.get('/', ctrl.listarGrupos);
router.get('/:id', ctrl.obtenerGrupo);
router.post('/:id/join', validateJoin, ctrl.unirseAGrupo);
router.post('/:id/leave', validateLeave, ctrl.salirDeGrupo);
router.post('/:id/cerrar', validateCerrar, ctrl.cerrarGrupo);

// 🔁 NUEVO: eliminación (importante para grupos recurrentes)
router.delete('/:id', validateEliminar, ctrl.eliminarGrupo);

/* Rutas de calificaciones ancladas al grupo (GET sí; POST deshabilitado) */
router.post('/:id/calificaciones', (_req, res) => {
  return res.status(410).json({
    error: 'Este endpoint fue deprecado. Usa POST /api/conductores/:id/calificar',
  });
});
router.get('/:id/calificaciones', validatePaginate, ctrl.listarCalificaciones);
router.get('/:id/calificacion-resumen', ctrl.obtenerResumenConductor);

module.exports = router;
