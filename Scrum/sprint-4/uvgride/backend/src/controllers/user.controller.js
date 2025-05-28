const User = require('../models/Usuario');

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Excluir información sensible
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    const [updated] = await User.update(updates, {
      where: { id: userId },
      returning: true,
      individualHooks: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};