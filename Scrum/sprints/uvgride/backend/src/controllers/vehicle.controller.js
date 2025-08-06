const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');

// Crear vehículo para un usuario
exports.crearVehiculo = async (req, res) => {
  try {
    const { id_usuario, marca, modelo, placa, color, capacidad_pasajeros } = req.body;

    if (!id_usuario || !marca || !modelo || !placa || !color || !capacidad_pasajeros) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verifica que el usuario exista y sea conductor
    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (usuario.tipo_usuario.toLowerCase() !== 'conductor') {
      return res.status(403).json({ error: 'Solo los conductores pueden registrar vehículos.' });
    }

    const nuevoVehiculo = await Vehiculo.create({
      id_usuario,
      marca,
      modelo,
      placa,
      color,
      capacidad_pasajeros,
    });

    res.status(201).json({ mensaje: 'Vehículo registrado correctamente', vehiculo: nuevoVehiculo });
  } catch (error) {
    console.error('❌ Error creando vehículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los vehículos de un usuario
exports.obtenerVehiculosPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const usuario = await Usuario.findByPk(id_usuario, {
      include: [{ model: Vehiculo, as: 'vehiculos' }],
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ vehiculos: usuario.vehiculos });
  } catch (error) {
    console.error('❌ Error al obtener vehículos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar vehículo por ID
exports.eliminarVehiculo = async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await Vehiculo.findByPk(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    await vehiculo.destroy();
    res.json({ mensaje: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error eliminando vehículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};