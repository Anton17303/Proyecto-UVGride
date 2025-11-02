// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function cleanEmail(v) {
  return (v || '').toString().trim().toLowerCase();
}
function cleanStr(v) {
  return (v || '').toString().trim();
}
function isTipoUsuario(v) {
  return v === 'Pasajero' || v === 'Conductor';
}

// ✅ Registro
exports.register = async (req, res) => {
  try {
    let {
      nombre,
      apellido,
      correo_institucional,
      contrasenia,
      telefono,
      tipo_usuario,
    } = req.body || {};

    // Normalización
    nombre = cleanStr(nombre);
    apellido = cleanStr(apellido);
    correo_institucional = cleanEmail(correo_institucional);
    telefono = cleanStr(telefono);
    tipo_usuario = cleanStr(tipo_usuario);

    // Validaciones básicas
    if (!nombre || !apellido || !correo_institucional || !contrasenia || !telefono || !tipo_usuario) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }
    if (!isTipoUsuario(tipo_usuario)) {
      return res.status(400).json({ error: 'tipo_usuario inválido (Pasajero | Conductor).' });
    }
    if (contrasenia.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // ¿Existe ya?
    const existingUser = await Usuario.findOne({
      where: { correo_institucional: { [Op.eq]: correo_institucional } },
      attributes: ['id_usuario'],
    });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const newUser = await Usuario.create({
      nombre,
      apellido,
      correo_institucional,
      contrasenia: hashedPassword,
      telefono,
      tipo_usuario,
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        correo_institucional: newUser.correo_institucional,
        telefono: newUser.telefono,
        tipo_usuario: newUser.tipo_usuario,
        // extras iniciales (probablemente null):
        avatar_url: newUser.avatar_url ?? null,
        bio: newUser.bio ?? null,
        emerg_contacto_nombre: newUser.emerg_contacto_nombre ?? null,
        emerg_contacto_telefono: newUser.emerg_contacto_telefono ?? null,
        acces_necesidades: newUser.acces_necesidades ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el registro' });
  }
};

// ✅ Login
exports.login = async (req, res) => {
  try {
    let { correo_institucional, contrasenia } = req.body || {};
    correo_institucional = cleanEmail(correo_institucional);

    if (!correo_institucional || !contrasenia) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    // ⚠️ Importante: ignorar defaultScope para traer `contrasenia`
    const user = await Usuario.unscoped().findOne({
      where: { correo_institucional: { [Op.eq]: correo_institucional } },
      attributes: [
        'id_usuario',
        'nombre',
        'apellido',
        'correo_institucional',
        'telefono',
        'tipo_usuario',
        'activo',
        'avatar_url',
        'bio',
        'emerg_contacto_nombre',
        'emerg_contacto_telefono',
        'acces_necesidades',
        'contrasenia', // <- necesaria para comparar
      ],
    });

    // Respuesta genérica para no filtrar existencia
    if (!user || !user.contrasenia) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(contrasenia, user.contrasenia);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      correo_institucional: user.correo_institucional,
      telefono: user.telefono,
      tipo_usuario: user.tipo_usuario,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('⚠️ JWT_SECRET no configurado. Usa una variable de entorno segura en producción.');
    }

    const token = jwt.sign(payload, secret || 'insecure-dev-secret', {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Respuesta sin contraseña
    return res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo_institucional: user.correo_institucional,
        telefono: user.telefono,
        tipo_usuario: user.tipo_usuario,
        activo: user.activo,
        avatar_url: user.avatar_url ?? null,
        bio: user.bio ?? null,
        emerg_contacto_nombre: user.emerg_contacto_nombre ?? null,
        emerg_contacto_telefono: user.emerg_contacto_telefono ?? null,
        acces_necesidades: user.acces_necesidades ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};
