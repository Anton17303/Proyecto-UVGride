-- =========================================
--  USUARIO (con cache global)
-- =========================================
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  correo_institucional VARCHAR(255) UNIQUE NOT NULL,
  contrasenia VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  tipo_usuario VARCHAR(255) NOT NULL, -- "Pasajero" | "Conductor"
  licencia_conducir VARCHAR(255),
  estado_disponibilidad VARCHAR(255),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  preferencia_tema VARCHAR(10) DEFAULT 'light',
  calif_conductor_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  calif_conductor_count INTEGER NOT NULL DEFAULT 0,
  avatar_url VARCHAR(255),            -- ruta pública del avatar (puede ser NULL)
  bio VARCHAR(300),                   -- descripción corta del perfil
  emerg_contacto_nombre VARCHAR(120), -- contacto de emergencia: nombre
  emerg_contacto_telefono VARCHAR(20),-- contacto de emergencia: teléfono
  acces_necesidades JSONB             -- necesidades especiales (formato libre, opcional)
);


-- =========================================
--  VEHÍCULO
-- =========================================
CREATE TABLE IF NOT EXISTS vehiculo (
  id_vehiculo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  marca VARCHAR(255) NOT NULL,
  modelo VARCHAR(255) NOT NULL,
  placa VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  capacidad_pasajeros INT NOT NULL,
  CONSTRAINT fk_vehiculo_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================================
--  VIAJE MAESTRO
-- =========================================
CREATE TABLE IF NOT EXISTS viaje_maestro (
  id_viaje_maestro SERIAL PRIMARY KEY,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  lat_origen DECIMAL(9,6),
  lon_origen DECIMAL(9,6),
  lat_destino DECIMAL(9,6),
  lon_destino DECIMAL(9,6),
  hora_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  costo_total DECIMAL(10,2) NOT NULL,
  distancia_km DECIMAL(8,2),
  tiempo_estimado INTEGER,
  estado_viaje VARCHAR(255) NOT NULL DEFAULT 'pendiente',
  es_programado BOOLEAN DEFAULT FALSE,
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER,
  conductor_id INTEGER,
  notas TEXT,
  calificacion INTEGER,
  CONSTRAINT fk_viaje_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_viaje_conductor
    FOREIGN KEY (conductor_id) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================
--  CALIFICACIÓN POR VIAJE (legacy / histórico)
--  (NO ACTUALIZA CACHE GLOBAL)
-- =========================================
CREATE TABLE IF NOT EXISTS calificacion_maestro (
  id_calificacion_maestro SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  puntuacion INT NOT NULL,
  objetivo_usuario_id INT NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_calif_viaje
    FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  CONSTRAINT fk_calif_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_calif_objetivo
    FOREIGN KEY (objetivo_usuario_id) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT chk_calif_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
  CONSTRAINT uq_calif_viaje_usuario_objetivo UNIQUE (id_viaje_maestro, id_usuario, objetivo_usuario_id)
);

CREATE TABLE IF NOT EXISTS calificacion_detalle (
  id_calificacion_detalle SERIAL PRIMARY KEY,
  id_calificacion_maestro INT NOT NULL,
  criterio VARCHAR(255) NOT NULL,
  puntuacion INT NOT NULL,
  CONSTRAINT fk_calif_det_maestro
    FOREIGN KEY (id_calificacion_maestro) REFERENCES calificacion_maestro(id_calificacion_maestro)
    ON DELETE CASCADE,
  CONSTRAINT chk_calif_detalle_puntuacion CHECK (puntuacion BETWEEN 1 AND 5)
);

-- Validación de negocio de calificación por viaje (se mantiene)
CREATE OR REPLACE FUNCTION validate_driver_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_usuario_id INT;
  v_conductor_id INT;
  v_estado VARCHAR(255);
BEGIN
  SELECT usuario_id, conductor_id, estado_viaje
  INTO v_usuario_id, v_conductor_id, v_estado
  FROM viaje_maestro
  WHERE id_viaje_maestro = NEW.id_viaje_maestro;

  IF NEW.id_usuario IS DISTINCT FROM v_usuario_id THEN
    RAISE EXCEPTION 'Solo el pasajero del viaje puede calificar';
  END IF;

  IF NEW.objetivo_usuario_id IS DISTINCT FROM v_conductor_id THEN
    RAISE EXCEPTION 'Solo puedes calificar al conductor del viaje';
  END IF;

  IF NEW.id_usuario = NEW.objetivo_usuario_id THEN
    RAISE EXCEPTION 'No puedes calificarte a ti mismo';
  END IF;

  IF v_estado NOT IN ('finalizado','completado') THEN
    RAISE EXCEPTION 'Solo se puede calificar un viaje finalizado';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calif_validate_before ON calificacion_maestro;
CREATE TRIGGER calif_validate_before
BEFORE INSERT OR UPDATE OF puntuacion, comentario, objetivo_usuario_id, id_viaje_maestro, id_usuario
ON calificacion_maestro
FOR EACH ROW EXECUTE FUNCTION validate_driver_rating();

-- (IMPORTANTE) Elimina triggers de cache del legacy para evitar conflicto con el nuevo flujo simple
DROP TRIGGER IF EXISTS calif_aiud_cache ON calificacion_maestro;
DROP FUNCTION IF EXISTS trg_calif_conductor_cache() CASCADE;
DROP FUNCTION IF EXISTS recalc_conductor_cache(INT) CASCADE;

CREATE INDEX IF NOT EXISTS idx_calif_objetivo ON calificacion_maestro(objetivo_usuario_id);
CREATE INDEX IF NOT EXISTS idx_calif_viaje ON calificacion_maestro(id_viaje_maestro);

-- =========================================
--  TARIFAS / PAGO / HISTÓRICO / REPORTES / ETC (sin cambios)
-- =========================================
CREATE TABLE IF NOT EXISTS tarifa_maestro (
  id_tarifa_maestro SERIAL PRIMARY KEY,
  tipo_servicio VARCHAR(255) NOT NULL,
  costo_base DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tarifa_detalle (
  id_tarifa_detalle SERIAL PRIMARY KEY,
  id_tarifa_maestro INT NOT NULL,
  tipo_usuario VARCHAR(255) NOT NULL,
  costo_por_km DECIMAL(10,2) NOT NULL,
  costo_por_minuto DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_tarifa_det_maestro
    FOREIGN KEY (id_tarifa_maestro) REFERENCES tarifa_maestro(id_tarifa_maestro)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metodo_pago (
  id_metodo_pago SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_pago VARCHAR(255) NOT NULL,
  detalle_pago VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL,
  CONSTRAINT fk_pago_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaccion (
  id_transaccion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  id_metodo_pago INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado_pago VARCHAR(255) NOT NULL,
  fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_tx_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_tx_viaje
    FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  CONSTRAINT fk_tx_mp
    FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_viajes (
  id_historial_viajes SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  estado VARCHAR(255) NOT NULL,
  CONSTRAINT fk_hist_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_hist_viaje
    FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reporte (
  id_reporte SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo_problema VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado_reporte VARCHAR(255) NOT NULL,
  fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reporte_viaje
    FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  CONSTRAINT fk_reporte_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  estado VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notif_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lugar_favorito (
  id_lugar_favorito SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre_lugar VARCHAR(255) NOT NULL,
  descripcion TEXT,
  color_hex VARCHAR(7) NOT NULL,
  fecha_agregado TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_fav_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bitacora (
  id_bitacora SERIAL PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL,
  id_usuario INT NOT NULL,
  operacion VARCHAR(255) NOT NULL,
  tabla_afectada VARCHAR(255) NOT NULL,
  id_registro_afectado INT NOT NULL,
  CONSTRAINT fk_bitacora_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seguro_vehiculo (
  id_seguro SERIAL PRIMARY KEY,
  id_vehiculo INT NOT NULL,
  proveedor VARCHAR(255) NOT NULL,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_vencimiento TIMESTAMP NOT NULL,
  cobertura TEXT NOT NULL,
  CONSTRAINT fk_seguro_vehiculo
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo)
    ON DELETE CASCADE
);

-- =========================================
--  VIAJE_PASAJERO (sin columna estado)
-- =========================================
CREATE TABLE IF NOT EXISTS viaje_pasajero (
  id_viaje_maestro INT NOT NULL REFERENCES viaje_maestro(id_viaje_maestro) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (id_viaje_maestro, id_usuario)
);

CREATE OR REPLACE FUNCTION trg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- =========================================
--  GRUPOS
-- =========================================
CREATE TABLE IF NOT EXISTS grupo_viaje (
  id_grupo SERIAL PRIMARY KEY,
  id_viaje_maestro INTEGER NOT NULL,
  conductor_id INTEGER NOT NULL,
  capacidad_total INTEGER NOT NULL CHECK (capacidad_total > 0),
  precio_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado_grupo VARCHAR(20) NOT NULL DEFAULT 'abierto'
    CHECK (estado_grupo IN ('abierto','cerrado','cancelado','finalizado')),
  notas TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_grupo_viaje_maestro
    FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grupo_conductor
    FOREIGN KEY (conductor_id) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_grupo_por_viaje UNIQUE (id_viaje_maestro)
);

CREATE INDEX IF NOT EXISTS idx_grupo_estado ON grupo_viaje(estado_grupo);
CREATE INDEX IF NOT EXISTS idx_grupo_conductor ON grupo_viaje(conductor_id);
CREATE INDEX IF NOT EXISTS idx_grupo_viaje ON grupo_viaje(id_viaje_maestro);

DROP TRIGGER IF EXISTS grupo_viaje_touch_updated ON grupo_viaje;
CREATE TRIGGER grupo_viaje_touch_updated
BEFORE UPDATE ON grupo_viaje
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

CREATE TABLE IF NOT EXISTS grupo_miembro (
  id_grupo_miembro SERIAL PRIMARY KEY,
  id_grupo INTEGER NOT NULL,
  id_usuario INTEGER NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'pasajero'
    CHECK (rol IN ('conductor','pasajero')),
  estado_solicitud VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado_solicitud IN ('pendiente','aprobado','rechazado','baja')),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_miembro_grupo
    FOREIGN KEY (id_grupo) REFERENCES grupo_viaje(id_grupo)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_miembro_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_usuario_en_grupo UNIQUE (id_grupo, id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_miembro_estado ON grupo_miembro(estado_solicitud);
CREATE INDEX IF NOT EXISTS idx_miembro_grupo ON grupo_miembro(id_grupo);
CREATE INDEX IF NOT EXISTS idx_miembro_user ON grupo_miembro(id_usuario);

-- Cupos disponibles
CREATE OR REPLACE FUNCTION check_cupos_disponibles()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  capacidad INTEGER;
  aprobados INTEGER;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.estado_solicitud = 'aprobado')
     OR (TG_OP = 'UPDATE' AND NEW.estado_solicitud = 'aprobado' AND (OLD.estado_solicitud IS DISTINCT FROM 'aprobado')) THEN
    SELECT g.capacidad_total,
           COALESCE((
             SELECT COUNT(*) FROM grupo_miembro gm
             WHERE gm.id_grupo = NEW.id_grupo
               AND gm.estado_solicitud = 'aprobado'
           ),0)
    INTO capacidad, aprobados
    FROM grupo_viaje g
    WHERE g.id_grupo = NEW.id_grupo;
    IF aprobados >= capacidad THEN
      RAISE EXCEPTION 'El grupo ya no tiene cupos disponibles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grupo_miembro_check_cupos ON grupo_miembro;
CREATE TRIGGER grupo_miembro_check_cupos
BEFORE INSERT OR UPDATE OF estado_solicitud ON grupo_miembro
FOR EACH ROW EXECUTE FUNCTION check_cupos_disponibles();

-- Autocerrar cuando se llena
CREATE OR REPLACE FUNCTION close_group_when_full()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  capacidad INTEGER;
  aprobados INTEGER;
BEGIN
  IF NEW.estado_solicitud = 'aprobado' THEN
    SELECT g.capacidad_total,
           COALESCE((
             SELECT COUNT(*) FROM grupo_miembro gm
             WHERE gm.id_grupo = NEW.id_grupo
               AND gm.estado_solicitud = 'aprobado'
           ),0)
    INTO capacidad, aprobados
    FROM grupo_viaje g
    WHERE g.id_grupo = NEW.id_grupo;
    IF aprobados >= capacidad THEN
      UPDATE grupo_viaje
      SET estado_grupo = 'cerrado', updated_at = NOW()
      WHERE id_grupo = NEW.id_grupo
        AND estado_grupo = 'abierto';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grupo_miembro_autoclose ON grupo_miembro;
CREATE TRIGGER grupo_miembro_autoclose
AFTER INSERT OR UPDATE OF estado_solicitud ON grupo_miembro
FOR EACH ROW EXECUTE FUNCTION close_group_when_full();

-- Vistas auxiliares
DROP VIEW IF EXISTS v_grupos_abiertos;
CREATE OR REPLACE VIEW v_grupos_abiertos AS
SELECT
  g.id_grupo,
  g.id_viaje_maestro,
  g.conductor_id,
  u.nombre AS conductor_nombre,
  u.apellido AS conductor_apellido,
  v.origen,
  v.destino,
  v.fecha_inicio,
  g.capacidad_total,
  COALESCE((
    SELECT COUNT(*) FROM grupo_miembro gm
    WHERE gm.id_grupo = g.id_grupo AND gm.estado_solicitud = 'aprobado'
  ), 0) AS cupos_usados,
  (g.capacidad_total - COALESCE((
    SELECT COUNT(*) FROM grupo_miembro gm
    WHERE gm.id_grupo = g.id_grupo AND gm.estado_solicitud = 'aprobado'
  ), 0)) AS cupos_disponibles,
  g.precio_base,
  g.estado_grupo,
  g.created_at,
  g.updated_at
FROM grupo_viaje g
JOIN viaje_maestro v ON v.id_viaje_maestro = g.id_viaje_maestro
JOIN usuario u ON u.id_usuario = g.conductor_id
WHERE g.estado_grupo = 'abierto';

DROP VIEW IF EXISTS v_grupos_cards;
CREATE OR REPLACE VIEW v_grupos_cards AS
WITH vehiculo_principal AS (
  SELECT DISTINCT ON (ve.id_usuario)
    ve.id_usuario,
    ve.id_vehiculo,
    ve.marca,
    ve.modelo,
    ve.placa,
    ve.color,
    ve.capacidad_pasajeros
  FROM vehiculo ve
  ORDER BY ve.id_usuario, ve.id_vehiculo DESC
)
SELECT
  g.id_grupo,
  g.id_viaje_maestro,
  u.id_usuario AS conductor_id,
  u.nombre AS conductor_nombre,
  u.apellido AS conductor_apellido,
  vp.marca AS vehiculo_marca,
  vp.modelo AS vehiculo_modelo,
  vp.placa AS vehiculo_placa,
  vp.color AS vehiculo_color,
  vp.capacidad_pasajeros AS vehiculo_capacidad_pasajeros,
  v.origen,
  v.destino,
  v.fecha_inicio,
  g.capacidad_total,
  COALESCE((
    SELECT COUNT(*) FROM grupo_miembro gm
    WHERE gm.id_grupo = g.id_grupo AND gm.estado_solicitud = 'aprobado'
  ), 0) AS cupos_usados,
  (g.capacidad_total - COALESCE((
    SELECT COUNT(*) FROM grupo_miembro gm
    WHERE gm.id_grupo = g.id_grupo AND gm.estado_solicitud = 'aprobado'
  ), 0)) AS cupos_disponibles,
  g.precio_base,
  g.estado_grupo,
  g.created_at,
  g.updated_at
FROM grupo_viaje g
JOIN viaje_maestro v ON v.id_viaje_maestro = g.id_viaje_maestro
JOIN usuario u ON u.id_usuario = g.conductor_id
LEFT JOIN vehiculo_principal vp ON vp.id_usuario = u.id_usuario
WHERE g.estado_grupo = 'abierto';

CREATE INDEX IF NOT EXISTS idx_viaje_fecha_inicio ON viaje_maestro(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_viaje_destino ON viaje_maestro(destino);

-- =========================================
--  CALIFICACIÓN GLOBAL (flujo simple)
-- =========================================
CREATE TABLE IF NOT EXISTS conductor_rating (
  id_conductor_rating SERIAL PRIMARY KEY,
  conductor_id INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  pasajero_id  INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  puntuacion   INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario   TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_conductor_pasajero UNIQUE (conductor_id, pasajero_id)
);

CREATE INDEX IF NOT EXISTS idx_conductor_rating_conductor ON conductor_rating (conductor_id);
CREATE INDEX IF NOT EXISTS idx_conductor_rating_pasajero  ON conductor_rating (pasajero_id);

-- Trigger genérico de updated_at
DROP TRIGGER IF EXISTS conductor_rating_touch_updated ON conductor_rating;
CREATE TRIGGER conductor_rating_touch_updated
BEFORE UPDATE ON conductor_rating
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- Recalcular cache global desde conductor_rating
CREATE OR REPLACE FUNCTION recalc_conductor_cache_simple(p_conductor_id INT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE usuario u
  SET calif_conductor_avg = COALESCE(sub.avg_score, 0),
      calif_conductor_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT conductor_id,
           AVG(puntuacion)::NUMERIC(3,2) AS avg_score,
           COUNT(*) AS cnt
    FROM conductor_rating
    WHERE conductor_id = p_conductor_id
    GROUP BY conductor_id
  ) sub
  WHERE u.id_usuario = p_conductor_id;

  -- si no tiene filas, deja 0/0
  UPDATE usuario
  SET calif_conductor_avg = 0,
      calif_conductor_count = 0
  WHERE id_usuario = p_conductor_id
    AND NOT EXISTS (SELECT 1 FROM conductor_rating cr WHERE cr.conductor_id = p_conductor_id);
END;
$$;

-- Trigger AIUD para mantener el cache
CREATE OR REPLACE FUNCTION trg_conductor_rating_aiud()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_id INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.conductor_id;
  ELSE
    target_id := NEW.conductor_id;
  END IF;

  IF target_id IS NOT NULL THEN
    PERFORM recalc_conductor_cache_simple(target_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS conductor_rating_aiud ON conductor_rating;
CREATE TRIGGER conductor_rating_aiud
AFTER INSERT OR UPDATE OR DELETE ON conductor_rating
FOR EACH ROW EXECUTE PROCEDURE trg_conductor_rating_aiud();

-- Vista de resumen global (lee el cache de usuario)
DROP VIEW IF EXISTS v_conductor_rating_summary;
CREATE OR REPLACE VIEW v_conductor_rating_summary AS
SELECT
  u.id_usuario AS conductor_id,
  u.nombre,
  u.apellido,
  u.calif_conductor_avg AS rating_avg,
  u.calif_conductor_count AS rating_count
FROM usuario u;