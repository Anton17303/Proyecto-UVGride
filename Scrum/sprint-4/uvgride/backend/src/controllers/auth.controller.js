const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// ✅ Registro
exports.register = async (req, res) => {
  const { nombre, apellido, correo_institucional, contrasenia, telefono, tipo_usuario } = req.body;

  try {
    // Verificar si ya existe
    const existingUser = await Usuario.findOne({ where: { correo_institucional } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    // Crear usuario
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

// ✅ Login
exports.login = async (req, res) => {
  const { correo_institucional, contrasenia } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await Usuario.findOne({ where: { correo_institucional } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(contrasenia, user.contrasenia);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign({ id_usuario: user.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });

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