const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/grupo.controller');

/* -----------------------------
   Helpers de validación simples
------------------------------ */
const toNumber = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const isPosInt = (v) => Number.isInteger(toNumber(v)) && toNumber(v) > 0;

const validateCrearGrupo = (req, res, next) => {
  const {
    conductor_id,
    destino_nombre,
    cupos_totales,
    lat_destino,
    lon_destino,
    fecha_salida,
    costo_estimado,
    // opcionales: notas, lat_origen, lon_origen, etc. si decides soportarlos luego
  } = req.body || {};

  if (!isPosInt(conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }

  if (!destino_nombre || !String(destino_nombre).trim()) {
    return res.status(400).json({ error: 'destino_nombre es requerido' });
  }

  if (!isPosInt(cupos_totales)) {
    return res.status(400).json({ error: 'cupos_totales debe ser un entero > 0' });
  }

  // Coordenadas opcionales pero válidas si vienen
  if (lat_destino != null) {
    const n = toNumber(lat_destino);
    if (!Number.isFinite(n) || n < -90 || n > 90) {
      return res.status(400).json({ error: 'lat_destino inválida' });
    }
  }

  if (lon_destino != null) {
    const n = toNumber(lon_destino);
    if (!Number.isFinite(n) || n < -180 || n > 180) {
      return res.status(400).json({ error: 'lon_destino inválida' });
    }
  }

  // fecha_salida opcional pero válida
  if (fecha_salida) {
    const d = new Date(fecha_salida);
    if (Number.isNaN(d.getTime())) {
      return res
        .status(400)
        .json({ error: 'fecha_salida inválida (usar ISO o fecha válida)' });
    }
  }

  // costo_estimado opcional pero numérico
  if (costo_estimado != null) {
    const n = toNumber(costo_estimado);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'costo_estimado inválido' });
    }
  }

  next();
};

const validateIdParam = (req, res, next, id) => {
  if (!isPosInt(id)) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  req.grupoId = Number(id); // 👈 útil en controladores
  next();
};

const validateJoin = (req, res, next) => {
  const { id_usuario, monto_acordado } = req.body || {};

  if (!isPosInt(id_usuario)) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }

  if (monto_acordado != null) {
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
    return res.status(400).json({ error: 'estado inválido (cerrado|cancelado)' });
  }
  next();
};

/* -----------------------------
   Param validator
------------------------------ */
router.param('id', validateIdParam);

/* -----------------------------
   Rutas (todas con paths limpios)
------------------------------ */

// Crear grupo (conductor)
router.post('/', validateCrearGrupo, ctrl.crearGrupo);

// Listar grupos (por defecto abiertos)
// Soporta query: ?estado=abierto|en_curso|cerrado|cancelado&?q=texto
router.get('/', ctrl.listarGrupos);

// Detalle de grupo + miembros
router.get('/:id', ctrl.obtenerGrupo);

// Unirse a un grupo (pasajero)
router.post('/:id/join', validateJoin, ctrl.unirseAGrupo);

// Salir del grupo (miembro no-conductor)
router.post('/:id/leave', validateLeave, ctrl.salirDeGrupo);

// Cerrar/cancelar grupo (conductor creador)
router.post('/:id/cerrar', validateCerrar, ctrl.cerrarGrupo);

module.exports = router;