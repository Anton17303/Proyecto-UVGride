-- Usuarios
CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  correo_institucional VARCHAR(255) UNIQUE NOT NULL,
  contrasenia VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  tipo_usuario VARCHAR(255) NOT NULL, -- "Pasajero" o "Conductor"
  licencia_conducir VARCHAR(255),     -- Solo si es conductor
  estado_disponibilidad VARCHAR(255), -- Solo si es conductor
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  preferencia_tema VARCHAR(10) DEFAULT 'light'
);

-- Vehículos (ahora referencian directamente a 'usuario')
CREATE TABLE vehiculo (
  id_vehiculo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  marca VARCHAR(255) NOT NULL,
  modelo VARCHAR(255) NOT NULL,
  placa VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  capacidad_pasajeros INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Viajes
CREATE TABLE viaje_maestro (
  id_viaje_maestro SERIAL PRIMARY KEY,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  lat_origen DECIMAL(9,6),
  lon_origen DECIMAL(9,6),
  lat_destino DECIMAL(9,6),
  lon_destino DECIMAL(9,6),
  hora_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  costo_total DECIMAL(10,2) NOT NULL,
  estado_viaje VARCHAR(255) NOT NULL DEFAULT 'pendiente',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  distancia_km DECIMAL(8,2),
  tiempo_estimado INTEGER,
  usuario_id INTEGER,
  conductor_id INTEGER,
  notas TEXT,
  calificacion INTEGER,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (conductor_id) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Calificaciones maestro
CREATE TABLE calificacion_maestro (
  id_calificacion_maestro SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  puntuacion INT NOT NULL,
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Calificaciones detalle
CREATE TABLE calificacion_detalle (
  id_calificacion_detalle SERIAL PRIMARY KEY,
  id_calificacion_maestro INT NOT NULL,
  criterio VARCHAR(255) NOT NULL,
  puntuacion INT NOT NULL,
  FOREIGN KEY (id_calificacion_maestro) REFERENCES calificacion_maestro(id_calificacion_maestro)
    ON DELETE CASCADE
);

-- Tarifas
CREATE TABLE tarifa_maestro (
  id_tarifa_maestro SERIAL PRIMARY KEY,
  tipo_servicio VARCHAR(255) NOT NULL,
  costo_base DECIMAL(10,2) NOT NULL
);

CREATE TABLE tarifa_detalle (
  id_tarifa_detalle SERIAL PRIMARY KEY,
  id_tarifa_maestro INT NOT NULL,
  tipo_usuario VARCHAR(255) NOT NULL,
  costo_por_km DECIMAL(10,2) NOT NULL,
  costo_por_minuto DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_tarifa_maestro) REFERENCES tarifa_maestro(id_tarifa_maestro)
    ON DELETE CASCADE
);

-- Métodos de pago
CREATE TABLE metodo_pago (
  id_metodo_pago SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_pago VARCHAR(255) NOT NULL,
  detalle_pago VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Transacciones
CREATE TABLE transaccion (
  id_transaccion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  id_metodo_pago INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado_pago VARCHAR(255) NOT NULL,
  fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago)
    ON DELETE CASCADE
);

-- Historial de viajes
CREATE TABLE historial_viajes (
  id_historial_viajes SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  estado VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE
);

-- Reportes
CREATE TABLE reporte (
  id_reporte SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo_problema VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado_reporte VARCHAR(255) NOT NULL,
  fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Notificaciones
CREATE TABLE notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  estado VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Lugares favoritos
CREATE TABLE lugar_favorito (
  id_lugar_favorito SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre_lugar VARCHAR(255) NOT NULL,
  descripcion TEXT,
  color_hex VARCHAR(7) NOT NULL,
  fecha_agregado TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Bitácora
CREATE TABLE bitacora (
  id_bitacora SERIAL PRIMARY KEY,
  fecha_hora TIMESTAMP NOT NULL,
  id_usuario INT NOT NULL,
  operacion VARCHAR(255) NOT NULL,
  tabla_afectada VARCHAR(255) NOT NULL,
  id_registro_afectado INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
);

-- Seguro de vehículo
CREATE TABLE seguro_vehiculo (
  id_seguro SERIAL PRIMARY KEY,
  id_vehiculo INT NOT NULL,
  proveedor VARCHAR(255) NOT NULL,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_vencimiento TIMESTAMP NOT NULL,
  cobertura TEXT NOT NULL,
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo)
    ON DELETE CASCADE
);