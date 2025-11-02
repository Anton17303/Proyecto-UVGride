// backend/src/controllers/user.controller.js
const fs = require('fs');
const path = require('path');
// const bcrypt = require('bcryptjs'); // si luego habilitas cambio de contraseña
const { Usuario, Op } = require('../models');

/* ======================= Helpers ======================= */

const ALLOWED_UPDATE_FIELDS = [
  'nombre',
  'apellido',
  'telefono',
  'preferencia_tema',
  // nuevos:
  'bio',
  'emerg_contacto_nombre',
  'emerg_contacto_telefono',
  'acces_necesidades',
];

function trimOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return v;
  const t = v.trim();
  return t.length ? t : null;
}

function parseJsonMaybe(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'object') return v;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return Symbol.for('INVALID_JSON');
    }
  }
  return v;
}

function validateBasic(updates) {
  if (typeof updates.bio === 'string' && updates.bio.length > 300) {
    return 'La bio no puede exceder 300 caracteres.';
  }
  if (
    typeof updates.emerg_contacto_nombre === 'string' &&
    updates.emerg_contacto_nombre.length > 120
  ) {
    return 'El nombre de contacto de emergencia no puede exceder 120 caracteres.';
  }
  if (
    typeof updates.emerg_contacto_telefono === 'string' &&
    updates.emerg_contacto_telefono.length > 20
  ) {
    return 'El teléfono de contacto de emergencia no puede exceder 20 caracteres.';
  }
  if (
    typeof updates.emerg_contacto_telefono === 'string' &&
    updates.emerg_contacto_telefono
  ) {
    const rx = /^[0-9+()\-.\s]{6,20}$/;
    if (!rx.test(updates.emerg_contacto_telefono)) {
      return 'Formato de teléfono de contacto de emergencia inválido.';
    }
  }
  return null;
}

/* =====================================================
   GET /api/users/:id  -> Perfil por id (sin contraseña)
   ===================================================== */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await Usuario.findByPk(userId, {
      attributes: { exclude: ['contrasenia'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (error) {
    console.error('[users] getUserProfile error:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

/* =====================================================
   PUT /api/users/:id  -> Actualizar perfil (dueño + whitelist)
   ===================================================== */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Debe ser el dueño del perfil
    if (!req.user || Number(req.user.id_usuario) !== Number(userId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Whitelist + saneo
    const updates = {};
    for (const k of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        if (k === 'acces_necesidades') {
          const parsed = parseJsonMaybe(req.body[k]);
          if (parsed === Symbol.for('INVALID_JSON')) {
            return res.status(400).json({ error: 'acces_necesidades debe ser JSON válido.' });
          }
          updates[k] = parsed; // objeto/array/null
        } else {
          updates[k] = trimOrNull(req.body[k]);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay campos permitidos para actualizar.' });
    }

    const validationError = validateBasic(updates);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // (Opcional) Cambio de contraseña — recomendado en endpoint aparte
    /*
    if (Object.prototype.hasOwnProperty.call(req.body, 'contrasenia')) {
      if (!req.body.contrasenia || typeof req.body.contrasenia !== 'string') {
        return res.status(400).json({ error: 'Contraseña inválida' });
      }
      updates.contrasenia = await bcrypt.hash(req.body.contrasenia, 10);
    }
    */

    const [updated] = await Usuario.update(updates, { where: { id_usuario: userId } });
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ['contrasenia'] },
    });

    return res.json({
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[users] updateUserProfile error:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

/* =====================================================
   Alias basados en el usuario autenticado (/me)
   ===================================================== */
exports.getMe = (req, res, next) => {
  req.params.id = String(req.user.id_usuario);
  return exports.getUserProfile(req, res, next);
};

exports.updateMe = (req, res, next) => {
  req.params.id = String(req.user.id_usuario);
  return exports.updateUserProfile(req, res, next);
};

/* =====================================================
   PUT /api/users/me/avatar  -> Subir foto de perfil
   ===================================================== */
exports.updateMyAvatar = async (req, res) => {
  try {
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    const user = await Usuario.findByPk(req.user.id_usuario);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Si ya tenía avatar local, intenta borrarlo
    if (user.avatar_url && user.avatar_url.startsWith('/static/avatars/')) {
      try {
        const prev = path.join(
          process.cwd(),
          'uploads',
          'avatars',
          path.basename(user.avatar_url)
        );
        if (fs.existsSync(prev)) fs.unlinkSync(prev);
      } catch {
        // Ignorar error de borrado
      }
    }

    user.avatar_url = `/static/avatars/${req.file.filename}`;
    await user.save();

    return res.json({ message: 'Avatar actualizado', avatar_url: user.avatar_url });
  } catch (error) {
    console.error('[users] updateMyAvatar error:', error);
    return res.status(500).json({ error: 'Error al actualizar avatar' });
  }
};

/* =====================================================
   GET /api/users  o  /api/users/search  -> Buscar usuarios
   Query:
     q: string
     limit: 1..25 (default 10)
     exclude_me: 'true' | 'false'
   ===================================================== */
exports.searchUsers = async (req, res) => {
  try {
    const qRaw = (req.query.q || '').toString().trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 25);
    const excludeMe = String(req.query.exclude_me || '').toLowerCase() === 'true';

    if (!qRaw) return res.json({ data: [] });

    // Escapar comodines % y _ para LIKE/ILIKE
    const safe = qRaw.replace(/[%_]/g, m => '\\' + m);
    const term = `%${safe}%`;

    // Usar SOLO columnas existentes en el modelo
    const attrs = Usuario.rawAttributes || {};
    const whereOr = [];

    if (attrs.nombre) whereOr.push({ nombre: { [Op.iLike]: term } });
    if (attrs.apellido) whereOr.push({ apellido: { [Op.iLike]: term } });
    if (attrs.correo_institucional) whereOr.push({ correo_institucional: { [Op.iLike]: term } });

    // Si por alguna razón no hay campos buscables, devolver vacío
    if (whereOr.length === 0) return res.json({ data: [] });

    const where = { [Op.or]: whereOr };

    // Excluir al usuario autenticado si se solicita
    const meId = req.user && (req.user.id_usuario ?? req.user.id);
    if (excludeMe && meId) {
      where.id_usuario = { [Op.ne]: Number(meId) };
    }

    // Solo devolver atributos existentes para evitar errores
    const returnable = ['id_usuario', 'nombre', 'apellido', 'correo_institucional', 'tipo_usuario', 'avatar_url']
      .filter((k) => !!attrs[k]);

    const rows = await Usuario.findAll({
      where,
      attributes: returnable,
      order: [
        attrs.nombre ? ['nombre', 'ASC'] : ['id_usuario', 'ASC'],
        ...(attrs.apellido ? [['apellido', 'ASC']] : []),
      ],
      limit,
    });

    return res.json({ data: rows });
  } catch (err) {
    console.error('[users] searchUsers error:', err);
    return res.status(500).json({ error: 'Error al buscar usuarios' });
  }
};
