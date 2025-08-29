// src/services/groups.ts
import axios from 'axios';
import { API_URL } from './api';

export type Grupo = {
  id_grupo: number;
  destino_nombre: string;
  lat_destino: number | null;
  lon_destino: number | null;

  cupos_totales: number;
  cupos_disponibles: number;

  costo_estimado: number | null;
  estado: 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
  fecha_salida: string | null;
  conductor_id: number;

  conductor?: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    telefono: string;
    tipo_usuario: string;
    vehiculos?: Array<{
      id_vehiculo: number;
      marca: string;
      modelo: string;
      placa: string;
      color: string;
      capacidad_pasajeros: number;
    }>;
  };

  capacidad_total?: number;
  destino?: string;
  cupos_usados?: number;

  viaje?: {
    id_viaje_maestro: number;
    origen: string | null;
    destino: string | null;
    lat_destino: number | null;
    lon_destino: number | null;
    fecha_inicio: string | null;
    estado_viaje?: string | null;
  };
};

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  });
  return out;
}

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza item de API -> Grupo */
function normalizeGrupo(api: any): Grupo {
  const capacidadTotal =
    toNum(api.capacidad_total) ??
    toNum(api.cupos_totales) ??
    0;

  // 👇 OJO: vienen como strings desde Sequelize (e.g. "2"), por eso usamos toNum
  const cuposUsados = toNum(api.cupos_usados);
  const cuposDisponiblesApi = toNum(api.cupos_disponibles);

  const cuposDisponibles =
    cuposDisponiblesApi != null
      ? cuposDisponiblesApi
      : cuposUsados != null
      ? Math.max(capacidadTotal - cuposUsados, 0)
      : capacidadTotal; // fallback razonable si no llegó el cálculo

  const estado =
    (api.estado as any) ||
    (api.estado_grupo as any) ||
    'abierto';

  const destinoTexto =
    api.viaje?.destino ??
    api.destino ??
    api.destino_nombre ??
    '';

  return {
    id_grupo: Number(api.id_grupo),
    destino_nombre: String(destinoTexto),
    lat_destino: toNum(api.viaje?.lat_destino ?? api.lat_destino),
    lon_destino: toNum(api.viaje?.lon_destino ?? api.lon_destino),

    cupos_totales: Number(capacidadTotal),
    cupos_disponibles: Number(cuposDisponibles),

    costo_estimado: toNum(api.costo_estimado ?? api.precio_base),

    estado,
    fecha_salida: api.viaje?.fecha_inicio ?? api.fecha_salida ?? null,

    conductor_id: Number(api.conductor_id),

    conductor: api.conductor,

    capacidad_total: Number(capacidadTotal),
    destino: api.destino,
    cupos_usados: cuposUsados ?? undefined,

    viaje: api.viaje
      ? {
          id_viaje_maestro: Number(api.viaje.id_viaje_maestro),
          origen: api.viaje.origen ?? null,
          destino: api.viaje.destino ?? null,
          lat_destino: toNum(api.viaje.lat_destino),
          lon_destino: toNum(api.viaje.lon_destino),
          fecha_inicio: api.viaje.fecha_inicio ?? null,
          estado_viaje: api.viaje.estado_viaje ?? null,
        }
      : undefined,
  };
}

/** GET /api/grupos?estado=&q= */
export async function listGroups(params?: { estado?: string; q?: string }) {
  const res = await axios.get<{ data: any[] }>(`${API_URL}/api/grupos`, { params });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(normalizeGrupo);
}

/** GET /api/grupos/:id */
export async function getGroup(id: number) {
  const res = await axios.get<{ data: any }>(`${API_URL}/api/grupos/${id}`);
  const g = res.data?.data ?? res.data;
  return normalizeGrupo(g);
}

/** POST /api/grupos */
export async function createGroup(payload: {
  conductor_id: number;
  destino_nombre: string;
  cupos_totales: number;
  lat_destino?: number | null;
  lon_destino?: number | null;
  fecha_salida?: string | null;
  costo_estimado?: number | null;
  notas?: string | null;
}) {
  const body = clean({
    conductor_id: payload.conductor_id,
    destino: payload.destino_nombre?.trim(),
    capacidad_total: payload.cupos_totales,
    lat_destino: payload.lat_destino ?? undefined,
    lon_destino: payload.lon_destino ?? undefined,
    fecha_salida: payload.fecha_salida ?? undefined,
    costo_estimado: payload.costo_estimado ?? undefined,
    notas: payload.notas ?? undefined,
  });

  const res = await axios.post(`${API_URL}/api/grupos`, body);
  return res.data?.data ?? res.data;
}

export async function joinGroup(
  groupId: number,
  payload: { id_usuario: number; monto_acordado?: number | null }
) {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/join`, clean(payload));
  return res.data;
}

export async function closeGroup(
  groupId: number,
  payload: { conductor_id: number; estado?: 'cerrado' | 'cancelado' | 'finalizado' }
) {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/cerrar`, clean(payload));
  return res.data;
}

export async function rateDriver(
  groupId: number,
  payload: { id_usuario: number; puntuacion: number; comentario?: string }
) {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/calificaciones`, clean(payload));
  return res.data;
}

export async function listRatings(
  groupId: number,
  params?: { limit?: number; offset?: number }
) {
  const res = await axios.get(`${API_URL}/api/grupos/${groupId}/calificaciones`, { params });
  return res.data;
}

export async function getRatingSummary(groupId: number) {
  const res = await axios.get(`${API_URL}/api/grupos/${groupId}/calificacion-resumen`);
  return res.data;
}