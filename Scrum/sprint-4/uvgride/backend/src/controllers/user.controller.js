const Usuario = require('../models/Usuario');

// Obtener perfil de usuario
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Usuario.findByPk(userId, {
      attributes: { exclude: ['contrasenia'] } // Excluir información sensible
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

// Actualizar perfil de usuario
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Verificar que el usuario que hace la solicitud es el dueño del perfil
    if (req.user.id_usuario !== parseInt(userId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Si se actualiza la contraseña, hashearla
    if (updates.contrasenia) {
      updates.contrasenia = await bcrypt.hash(updates.contrasenia, 10);
    }

    const [updated] = await Usuario.update(updates, {
      where: { id_usuario: userId },
      returning: true,
      individualHooks: true
    });

    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ['contrasenia'] }
    });

    res.json({
      message: 'Perfil actualizado correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};