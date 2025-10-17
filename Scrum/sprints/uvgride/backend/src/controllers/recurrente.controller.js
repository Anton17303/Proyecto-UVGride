const { ViajeRecurrenteGrupo, ExcepcionViajeRecurrente, GrupoMiembro } = require('../models');
const { calcularSiguienteInstancia } = require('../services/recurrente.service');
const { Op } = require('sequelize');

// Valida que el usuario sea owner/admin del grupo (ajusta a tu lógica real)
async function puedeGestionar(usuarioId, grupoId) {
  const miembro = await GrupoMiembro.findOne({
    where: { grupo_id: grupoId, usuario_id: usuarioId, estado: 'activo', rol: { [Op.in]: ['owner','admin'] } }
  });
  return !!miembro;
}

exports.crear = async (req, res) => {
  const { grupoId } = req.params;
  const { titulo, origen, destino, mascara_semana, hora_local, zona_horaria,
          cupos, conductor_id, fecha_inicio, fecha_fin, notas } = req.body;

  if (!await puedeGestionar(req.user.id, grupoId)) {
    return res.status(403).json({ error: 'Sin permisos para gestionar este grupo' });
  }

  try {
    const vrg = await ViajeRecurrenteGrupo.create({
      grupo_id: grupoId,
      titulo,
      origen,
      destino,
      mascara_semana,
      hora_local,
      zona_horaria: zona_horaria || 'America/Guatemala',
      cupos: cupos || 4,
      conductor_id,
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      notas,
      creado_por: req.user.id,
      activo: true
    });

    const siguiente = await calcularSiguienteInstancia(vrg);
    await vrg.update({ siguiente_instancia: siguiente });

    res.status(201).json(vrg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.listar = async (req, res) => {
  const { grupoId } = req.params;
  const items = await ViajeRecurrenteGrupo.findAll({
    where: { grupo_id: grupoId },
    order: [['updated_at','DESC']],
    include: [{ model: ExcepcionViajeRecurrente, as: 'excepciones' }]
  });
  res.json(items);
};

exports.detalle = async (req, res) => {
  const { id } = req.params;
  const vrg = await ViajeRecurrenteGrupo.findByPk(id, {
    include: [{ model: ExcepcionViajeRecurrente, as: 'excepciones' }]
  });
  if (!vrg) return res.status(404).json({ error: 'No encontrado' });
  res.json(vrg);
};

exports.actualizar = async (req, res) => {
  const { grupoId, id } = req.params;
  if (!await puedeGestionar(req.user.id, grupoId)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const vrg = await ViajeRecurrenteGrupo.findByPk(id);
  if (!vrg) return res.status(404).json({ error: 'No encontrado' });

  await vrg.update(req.body);
  const siguiente = await calcularSiguienteInstancia(vrg);
  await vrg.update({ siguiente_instancia: siguiente });

  res.json(vrg);
};

exports.toggle = async (req, res) => {
  const { grupoId, id } = req.params;
  if (!await puedeGestionar(req.user.id, grupoId)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const vrg = await ViajeRecurrenteGrupo.findByPk(id);
  if (!vrg) return res.status(404).json({ error: 'No encontrado' });

  vrg.activo = !vrg.activo;
  await vrg.save();
  res.json({ activo: vrg.activo });
};

exports.agregarExcepcion = async (req, res) => {
  const { grupoId, id } = req.params;
  const { fecha, accion, nueva_hora_local, nota } = req.body;

  if (!await puedeGestionar(req.user.id, grupoId)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  if (accion === 'cambiar_hora' && !nueva_hora_local) {
    return res.status(400).json({ error: 'nueva_hora_local es requerida cuando accion=cambiar_hora' });
  }

  const ex = await ExcepcionViajeRecurrente.upsert({
    recurrente_id: id,
    fecha,
    accion,
    nueva_hora_local: nueva_hora_local || null,
    nota
  }, { returning: true });

  res.status(201).json(ex[0]);
};
