// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../controllers/auth.middleware');
const { uploadAvatar } = require('../controllers/avatar.middleware');

const {
  getUserProfile,
  updateUserProfile,
  getMe,
  updateMe,
  updateMyAvatar,
  searchUsers, // ⬅️ usamos el controller
} = require('../controllers/user.controller');

/* ========================
   Validador/Sanitizador
   ======================== */
const ALLOWED_UPDATE_FIELDS = new Set([
  'nombre',
  'apellido',
  'telefono',
  'preferencia_tema',
  // nuevos:
  'bio',
  'emerg_contacto_nombre',
  'emerg_contacto_telefono',
  'acces_necesidades',
]);

function validateAndNormalizeUpdate(req, res, next) {
  const src = req.body || {};
  const out = {};

  for (const k of Object.keys(src)) {
    if (!ALLOWED_UPDATE_FIELDS.has(k)) continue;

    if (k === 'acces_necesidades') {
      let val = src[k];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') {
          val = null;
        } else {
          try {
            val = JSON.parse(trimmed);
          } catch {
            return res.status(400).json({ error: 'acces_necesidades debe ser JSON válido.' });
          }
        }
      }
      out[k] = val; // objeto/array/null
    } else {
      const v = typeof src[k] === 'string' ? src[k].trim() : src[k];
      out[k] = v ?? null;
    }
  }

  if (typeof out.bio === 'string' && out.bio.length > 300) {
    return res.status(400).json({ error: 'La bio no puede exceder 300 caracteres.' });
  }
  if (typeof out.emerg_contacto_nombre === 'string' && out.emerg_contacto_nombre.length > 120) {
    return res.status(400).json({ error: 'El nombre del contacto de emergencia no puede exceder 120 caracteres.' });
  }
  if (typeof out.emerg_contacto_telefono === 'string' && out.emerg_contacto_telefono) {
    if (out.emerg_contacto_telefono.length > 20) {
      return res.status(400).json({ error: 'El teléfono de contacto de emergencia no puede exceder 20 caracteres.' });
    }
    const rx = /^[0-9+()\-.\s]{6,20}$/;
    if (!rx.test(out.emerg_contacto_telefono)) {
      return res.status(400).json({ error: 'Formato de teléfono de contacto de emergencia inválido.' });
    }
  }

  if (Object.keys(out).length === 0) {
    return res.status(400).json({ error: 'No hay campos permitidos para actualizar.' });
  }

  req.body = out;
  next();
}

/* ---------------------------
   Rutas /me (antes que '/:id')
   --------------------------- */
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validateAndNormalizeUpdate, updateMe);
router.put('/me/avatar', authMiddleware, uploadAvatar.single('avatar'), updateMyAvatar);

/* ----------------------------------------------------
   🔎 Búsqueda por nombre/apellido/correo (con auth)
   GET /api/users?q=texto&limit=10
   Alias /search para compatibilidad
   ---------------------------------------------------- */
router.get('/', authMiddleware, searchUsers);
router.get('/search', authMiddleware, searchUsers);

/* ---------------------------
   Rutas por id (admin/compat)
   --------------------------- */
router.get('/:id', authMiddleware, getUserProfile);
router.put('/:id', authMiddleware, validateAndNormalizeUpdate, updateUserProfile);

module.exports = router;
