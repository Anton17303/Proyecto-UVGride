-- Crear la database.
create database uvgride;

-- Ver la database actual.
select current_database();

-- select para verificar la correcta creación.
select * from calificacion_detalle cd ;

-- Creación de las entidades.
create table usuario (
id_usuario serial primary key,
nombre varchar(255) not null,
apellido varchar(255) not null,
correo_institucional varchar(255) unique not null,
contrasenia varchar(255) not null,
telefono varchar(20) not null,
tipo_usuario varchar(255) not null
);

create table vehiculo (
id_vehiculo serial primary key,
id_conductor int not null,
marca varchar(255) not null,
modelo varchar(255) not null,
placa varchar(255) not null,
color varchar(255) not null,
capacidad_pasajeros int not null
);

create table conductor (
id_conductor serial primary key,
id_usuario int not null,
licencia_conducir varchar(255) not null,
estado_disponibilidad varchar(255) not null,
id_vehiculo int not null,
foreign key (id_usuario) references usuario(id_usuario),
foreign key (id_vehiculo) references vehiculo(id_vehiculo)
);

create table viaje_maestro(
id_viaje_maestro serial primary key,
id_conductor int not null,
origen varchar(255) not null,
destino varchar(255) not null,
hora_solicitud timestamp not null,
hora_inicio timestamp not null,
hora_finalizacion timestamp not null,
estado_viaje varchar(255) not null,
costo_total decimal(10,2) not null,
foreign key (id_conductor) references conductor(id_conductor)
);

create table viaje_detalle(
id_viaje_detalle serial primary key,
id_viaje_maestro int not null,
id_pasajero int not null,
estado_pasajero varchar(255) not null,
foreign key (id_viaje_maestro) references viaje_maestro(id_viaje_maestro),
foreign key (id_pasajero) references usuario(id_usuario)
);

create table calificacion_maestro(
id_calificacion_maestro serial primary key,
id_viaje int not null,
id_usuario int not null,
puntuacion int not null,
foreign key (id_viaje) references viaje_maestro(id_viaje_maestro),
foreign key (id_usuario) references usuario(id_usuario)
);

create table calificacion_detalle(
id_calificacion_detalle serial primary key,
id_calificacion_maestro int not null,
criterio varchar(255) not null,
puntuacion int not null,
foreign key (id_calificacion_maestro) references calificacion_maestro(id_calificacion_maestro)
);

create table tarifa_maestro(
id_tarifa_maestro serial primary key,
tipo_servicio varchar(255) not null,
costo_base decimal(10,2) not null
);

create table tarifa_detalle(
id_tarifa_detalle serial primary key,
id_tarifa_maestro int not null,
tipo_usuario varchar(255) not null,
costo_por_km decimal(10,2) not null,
costo_por_minuto decimal(10,2) not null,
foreign key (id_tarifa_maestro) references tarifa_maestro(id_tarifa_maestro)
);

create table metodo_pago(
id_metodo_pago serial primary key,
id_usuario int not null,
tipo_pago varchar(255) not null,
detalle_pago varchar(255) not null,
activo boolean not null,
foreign key (id_usuario) references usuario(id_usuario)
);

create table transaccion(
id_transaccion serial primary key,
id_usuario int not null,
id_viaje int not null,
id_metodo_pago int not null,
monto decimal(10,2) not null,
estado_pago varchar(255) not null,
fecha_pago timestamp not null,
foreign key (id_usuario) references usuario(id_usuario),
foreign key (id_viaje) references viaje_maestro(id_viaje_maestro),
foreign key (id_metodo_pago) references metodo_pago(id_metodo_pago)
);

create table historial_viajes(
id_historial_viajes serial primary key,
id_usuario int not null,
id_viaje int not null,
fecha timestamp not null,
estado varchar(255) not null,
foreign key (id_usuario) references usuario(id_usuario),
foreign key (id_viaje) references viaje_maestro(id_viaje_maestro)
);

create table reporte(
id_reporte serial primary key,
id_viaje int not null,
id_usuario int not null,
tipo_problema varchar(255) not null,
descripcion text not null,
estado_reporte varchar(255) not null,
fecha_reporte timestamp not null,
foreign key (id_viaje) references viaje_maestro(id_viaje_maestro),
foreign key (id_usuario) references usuario(id_usuario)
);

create table notificacion(
id_notificacion serial primary key,
id_usuario int not null,
mensaje text not null,
tipo varchar(255) not null,
estado varchar(255) not null,
fecha_envio timestamp not null,
foreign key (id_usuario) references usuario(id_usuario)
);

create table bitacora(
id_bitacora serial primary key,
fecha_hora timestamp not null,
id_usuario int not null,
operacion varchar(255) not null,
tabla_afectada varchar(255) not null,
id_registro_afectado int not null
);

-- version 1.1
create table seguro_vehiculo (
id_seguro serial primary key,
id_vehiculo int not null,
proveedor varchar(255) not null,
fecha_inicio timestamp not null,
fecha_vencimiento timestamp not null,
cobertura text not null,
foreign key (id_vehiculo) references vehiculo(id_vehiculo)
);

alter table usuario add column activo boolean not null default true;

alter table viaje_maestro 
alter column hora_inicio drop not null,
alter column hora_finalizacion drop not null;

alter table public.vehiculo add constraint vehiculo_conductor_fk foreign key (id_conductor) references public.conductor(id_conductor);
alter table public.conductor add constraint conductor_vehiculo_fk foreign key (id_vehiculo) references public.vehiculo(id_vehiculo);