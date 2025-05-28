const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// ✅ Controlador de registro
exports.register = async (req, res) => {
  const { nombre, apellido, correo_institucional, contrasenia, telefono, tipo_usuario } = req.body;

  try {
    const existingUser = await Usuario.findOne({ where: { correo_institucional } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const newUser = await Usuario.create({
      nombre,
      apellido,
      correo_institucional,
      contrasenia: hashedPassword,
      telefono,
      tipo_usuario
    });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        correo_institucional: newUser.correo_institucional,
        telefono: newUser.telefono,
        tipo_usuario: newUser.tipo_usuario
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el registro' });
  }
};

// ✅ Controlador de login
exports.login = async (req, res) => {
  const { correo_institucional, contrasenia } = req.body;

  try {
    const user = await Usuario.findOne({ where: { correo_institucional } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(contrasenia, user.contrasenia);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo_institucional: user.correo_institucional,
        telefono: user.telefono,
        tipo_usuario: user.tipo_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo_institucional: user.correo_institucional,
        telefono: user.telefono,
        tipo_usuario: user.tipo_usuario
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};