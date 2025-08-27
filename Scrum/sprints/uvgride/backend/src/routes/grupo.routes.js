// src/routes/grupo.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/grupo.controller');

/* Helpers */
const isNilOrEmpty = (v) => v === undefined || v === null || v === '';
const toNumber = (v) => (isNilOrEmpty(v) ? NaN : Number(v));
const isPosInt = (v) => Number.isInteger(toNumber(v)) && toNumber(v) > 0;

/* -------- Normalizador robusto --------
   - Trata '' como vacío
   - Mapea alias (destino_nombre → destino, cupos_totales → capacidad_total, costo_estimado → precio_base)
   - Castea a número cuando corresponde
--------------------------------------- */
const normalizeBody = (req, _res, next) => {
  const b = { ...(req.body || {}) };

  // destino
  if (isNilOrEmpty(b.destino) && !isNilOrEmpty(b.destino_nombre)) {
    b.destino = String(b.destino_nombre).trim();
  }
  if (!isNilOrEmpty(b.destino)) {
    b.destino = String(b.destino).trim();
  }

  // capacidad_total
  const rawCap =
    !isNilOrEmpty(b.capacidad_total) ? b.capacidad_total : b.cupos_totales;
  b.capacidad_total = isNilOrEmpty(rawCap) ? undefined : toNumber(rawCap);

  // precio_base
  const rawPrecio =
    !isNilOrEmpty(b.precio_base) ? b.precio_base : b.costo_estimado;
  b.precio_base = isNilOrEmpty(rawPrecio) ? undefined : toNumber(rawPrecio);

  // fecha_salida (deja string; el controller la convierte a Date si viene)
  if (isNilOrEmpty(b.fecha_salida)) delete b.fecha_salida;

  // limpia alias para que no confundan más adelante
  delete b.destino_nombre;
  delete b.cupos_totales;
  delete b.costo_estimado;

  req.body = b;
  next();
};

/* Validadores */
const validateCrearGrupo = (req, res, next) => {
  const { conductor_id, destino, capacidad_total, fecha_salida, precio_base } =
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
    if (!Number.isFinite(Number(precio_base)) || Number(precio_base) < 0) {
      return res.status(400).json({ error: 'precio_base inválido' });
    }
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
  if (estado && !['cerrado', 'cancelado'].includes(String(estado))) {
    return res
      .status(400)
      .json({ error: 'estado inválido (cerrado|cancelado)' });
  }
  next();
};

/* Params */
router.param('id', validateIdParam);

/* Rutas */
router.post('/', normalizeBody, validateCrearGrupo, ctrl.crearGrupo);
router.get('/', ctrl.listarGrupos);
router.get('/:id', ctrl.obtenerGrupo);
router.post('/:id/join', validateJoin, ctrl.unirseAGrupo);
router.post('/:id/leave', validateLeave, ctrl.salirDeGrupo);
router.post('/:id/cerrar', validateCerrar, ctrl.cerrarGrupo);

module.exports = router;