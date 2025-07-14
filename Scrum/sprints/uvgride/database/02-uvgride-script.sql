-- Usuarios
CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  correo_institucional VARCHAR(255) UNIQUE NOT NULL,
  contrasenia VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  tipo_usuario VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Conductores
CREATE TABLE conductor (
  id_conductor SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  licencia_conducir VARCHAR(255) NOT NULL,
  estado_disponibilidad VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Vehículos
CREATE TABLE vehiculo (
  id_vehiculo SERIAL PRIMARY KEY,
  id_conductor INT NOT NULL,
  marca VARCHAR(255) NOT NULL,
  modelo VARCHAR(255) NOT NULL,
  placa VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  capacidad_pasajeros INT NOT NULL,
  FOREIGN KEY (id_conductor) REFERENCES conductor(id_conductor)
);



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
  estado_viaje VARCHAR(255) NOT NULL DEFAULT 'pendiente'
);

-- Calificaciones maestro
CREATE TABLE calificacion_maestro (
  id_calificacion_maestro SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  puntuacion INT NOT NULL,
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Calificaciones detalle
CREATE TABLE calificacion_detalle (
  id_calificacion_detalle SERIAL PRIMARY KEY,
  id_calificacion_maestro INT NOT NULL,
  criterio VARCHAR(255) NOT NULL,
  puntuacion INT NOT NULL,
  FOREIGN KEY (id_calificacion_maestro) REFERENCES calificacion_maestro(id_calificacion_maestro)
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
);

-- Métodos de pago
CREATE TABLE metodo_pago (
  id_metodo_pago SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_pago VARCHAR(255) NOT NULL,
  detalle_pago VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Transacciones
CREATE TABLE transaccion (
  id_transaccion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  id_metodo_pago INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado_pago VARCHAR(255) NOT NULL,
  fecha_pago TIMESTAMP NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro),
  FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago)
);

-- Historial de viajes
CREATE TABLE historial_viajes (
  id_historial_viajes SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_viaje_maestro INT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  estado VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro)
);

-- Reportes
CREATE TABLE reporte (
  id_reporte SERIAL PRIMARY KEY,
  id_viaje_maestro INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo_problema VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado_reporte VARCHAR(255) NOT NULL,
  fecha_reporte TIMESTAMP NOT NULL,
  FOREIGN KEY (id_viaje_maestro) REFERENCES viaje_maestro(id_viaje_maestro),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Notificaciones
CREATE TABLE notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  estado VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMP NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Lugares favoritos
CREATE TABLE lugar_favorito (
  id_lugar_favorito SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre_lugar VARCHAR(255) NOT NULL,
  descripcion TEXT,
  latitud DECIMAL(9,6),
  longitud DECIMAL(9,6),
  imagen_url TEXT,
  fecha_agregado TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
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
);

-- Ajustes: permitir nulos en hora_inicio y hora_finalizacion
ALTER TABLE viaje_maestro 
  ALTER COLUMN hora_inicio DROP NOT NULL,
  ALTER COLUMN hora_finalizacion DROP NOT NULL;