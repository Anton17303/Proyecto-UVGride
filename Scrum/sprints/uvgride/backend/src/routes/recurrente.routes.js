const r = require('express').Router({ mergeParams: true });
const auth = require('../controllers/auth.middleware');
const ctrl = require('../controllers/recurrente.controller');

// Todas requieren auth (y pertenecer al grupo para ver/gestionar)
r.use(auth);

r.get('/', ctrl.listar);                 // GET /api/grupos/:grupoId/recurrente
r.post('/', ctrl.crear);                 // POST /api/grupos/:grupoId/recurrente
r.get('/:id', ctrl.detalle);             // GET /api/grupos/:grupoId/recurrente/:id
r.patch('/:id', ctrl.actualizar);        // PATCH /api/grupos/:grupoId/recurrente/:id
r.post('/:id/toggle', ctrl.toggle);      // POST /api/grupos/:grupoId/recurrente/:id/toggle
r.post('/:id/excepcion', ctrl.agregarExcepcion); // POST /api/grupos/:grupoId/recurrente/:id/excepcion

module.exports = r;

