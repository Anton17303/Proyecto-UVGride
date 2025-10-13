// backend/src/controllers/user.controller.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

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
// Campos permitidos: nombre, apellido, telefono, preferencia_tema
// (contraseña NO aquí; si decides permitirlo, comenta la sección marcada)
// =====================================================
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // 1) Verificar que el usuario autenticado es el dueño del perfil
    if (!req.user || req.user.id_usuario !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // 2) Whitelist de campos editables
    const allowed = ["nombre", "apellido", "telefono", "preferencia_tema"];
    const updates = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        updates[k] = req.body[k];
      }
    }

    // 3) (OPCIONAL - NO recomendado aquí) soporte de cambio de contraseña
    //    Si quieres permitirlo aquí, descomenta este bloque.
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
// NO son carpetas; son rutas HTTP que reutilizan la lógica anterior
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
