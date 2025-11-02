// backend/src/controllers/user.controller.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

// Helpers
const ALLOWED_UPDATE_FIELDS = [
  "nombre",
  "apellido",
  "telefono",
  "preferencia_tema",
  // nuevos:
  "bio",
  "emerg_contacto_nombre",
  "emerg_contacto_telefono",
  "acces_necesidades",
];

function trimOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t.length ? t : "";
}

function parseJsonMaybe(v) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "object") return v; // ya viene como objeto
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed;
    } catch (_) {
      return Symbol.for("INVALID_JSON");
    }
  }
  return v; // dejar pasar (Sequelize JSONB aceptará objetos/arrays)
}

function validateBasic(updates) {
  // longitud acorde al modelo/DDL
  if (typeof updates.bio === "string" && updates.bio.length > 300) {
    return "La bio no puede exceder 300 caracteres.";
  }
  if (
    typeof updates.emerg_contacto_nombre === "string" &&
    updates.emerg_contacto_nombre.length > 120
  ) {
    return "El nombre de contacto de emergencia no puede exceder 120 caracteres.";
  }
  if (
    typeof updates.emerg_contacto_telefono === "string" &&
    updates.emerg_contacto_telefono.length > 20
  ) {
    return "El teléfono de contacto de emergencia no puede exceder 20 caracteres.";
  }
  // validación muy permisiva de teléfono (solo si hay valor)
  if (typeof updates.emerg_contacto_telefono === "string" && updates.emerg_contacto_telefono) {
    const rx = /^[0-9+()\-.\s]{6,20}$/;
    if (!rx.test(updates.emerg_contacto_telefono)) {
      return "Formato de teléfono de contacto de emergencia inválido.";
    }
  }
  return null;
}

// =====================================================
// GET /api/users/:id  -> Perfil por id (excluye contraseña)
// =====================================================
exports.getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await Usuario.findByPk(userId, {
      attributes: { exclude: ["contrasenia"] },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el perfil del usuario" });
  }
};

// =====================================================
// PUT /api/users/:id  -> Actualizar perfil (dueño + whitelist)
// Campos permitidos: nombre, apellido, telefono, preferencia_tema,
// bio, emerg_contacto_nombre, emerg_contacto_telefono, acces_necesidades
// (contraseña NO aquí; si decides permitirlo, comenta la sección marcada)
// =====================================================
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // 1) Verificar que el usuario autenticado es el dueño del perfil
    if (!req.user || req.user.id_usuario !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // 2) Whitelist + saneo
    const updates = {};
    for (const k of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        if (k === "acces_necesidades") {
          const parsed = parseJsonMaybe(req.body[k]);
          if (parsed === Symbol.for("INVALID_JSON")) {
            return res.status(400).json({ error: "acces_necesidades debe ser JSON válido." });
          }
          updates[k] = parsed; // puede ser objeto/array o null
        } else {
          updates[k] = trimOrNull(req.body[k]);
        }
      }
    }

    // 2.1) Si no hay nada permitido, responde 400
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No hay campos permitidos para actualizar." });
    }

    // 2.2) Validaciones de longitud/formato
    const validationError = validateBasic(updates);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // 3) (OPCIONAL - NO recomendado aquí) soporte de cambio de contraseña
    /*
    if (Object.prototype.hasOwnProperty.call(req.body, "contrasenia")) {
      if (!req.body.contrasenia || typeof req.body.contrasenia !== "string") {
        return res.status(400).json({ error: "Contraseña inválida" });
      }
      updates.contrasenia = await bcrypt.hash(req.body.contrasenia, 10);
    }
    */

    // 4) Ejecutar update si hay algo que actualizar
    const [updated] = await Usuario.update(updates, {
      where: { id_usuario: userId },
    });

    if (!updated) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 5) Responder con el usuario actualizado (sin contraseña)
    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ["contrasenia"] },
    });

    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

// =====================================================
// ALIASES basados en el usuario autenticado (paths /me)
// =====================================================
exports.getMe = (req, res, next) => {
  req.params.id = String(req.user.id_usuario);
  return exports.getUserProfile(req, res, next);
};

exports.updateMe = (req, res, next) => {
  req.params.id = String(req.user.id_usuario);
  return exports.updateUserProfile(req, res, next);
};

// =====================================================
// PUT /api/users/me/avatar  -> Subir foto de perfil
// Requiere middleware uploadAvatar.single('avatar')
// Sirve archivos estáticos desde /static/avatars
// =====================================================
exports.updateMyAvatar = async (req, res) => {
  try {
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const user = await Usuario.findByPk(req.user.id_usuario);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si ya tenía avatar local, intenta borrarlo
    if (user.avatar_url && user.avatar_url.startsWith("/static/avatars/")) {
      try {
        const prev = path.join(
          process.cwd(),
          "uploads",
          "avatars",
          path.basename(user.avatar_url)
        );
        if (fs.existsSync(prev)) fs.unlinkSync(prev);
      } catch (_) {
        // Ignorar error de borrado
      }
    }

    user.avatar_url = `/static/avatars/${req.file.filename}`;
    await user.save();

    res.json({ message: "Avatar actualizado", avatar_url: user.avatar_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar avatar" });
  }
};
