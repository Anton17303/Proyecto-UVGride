import axios from 'axios';
import { API_URL } from './api';

export type Grupo = {
  id_grupo: number;
  // normalizamos: el backend devuelve "destino", nosotros seguimos usando "destino_nombre"
  destino_nombre: string;
  lat_destino: number | null;
  lon_destino: number | null;

  // para compatibilidad: el backend maneja capacidad_total y cupos usados.
  // mantenemos tu shape (cupos_totales/cupos_disponibles)
  cupos_totales: number;
  cupos_disponibles: number;

  costoEstimado?: number | null; // opcional si lo necesitas
  costo_estimado: number | null;

  estado: 'abierto' | 'en_curso' | 'cerrado' | 'cancelado';
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
  // campos extra que podría mandar el backend según la versión
  capacidad_total?: number;
  destino?: string;
  cupos_usados?: number;
};

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  });
  return out;
}

/** Normaliza cada item de la API a tu shape esperado en la app */
function normalizeGrupo(api: any): Grupo {
  const capacidadTotal =
    typeof api.capacidad_total === 'number'
      ? api.capacidad_total
      : typeof api.cupos_totales === 'number'
      ? api.cupos_totales
      : undefined;

  const cuposDisponibles =
    typeof api.cupos_disponibles === 'number'
      ? api.cupos_disponibles
      : typeof api.cupos_usados === 'number' && typeof capacidadTotal === 'number'
      ? Math.max(capacidadTotal - api.cupos_usados, 0)
      : undefined;

  return {
    id_grupo: api.id_grupo,
    destino_nombre: api.destino ?? api.destino_nombre ?? '',
    lat_destino: api.lat_destino ?? null,
    lon_destino: api.lon_destino ?? null,

    cupos_totales: capacidadTotal ?? 0,
    cupos_disponibles: cuposDisponibles ?? 0,

    costo_estimado: api.costo_estimado ?? null,
    costoEstimado: api.costo_estimado ?? null, // alias opcional

    estado: api.estado ?? api.estado_grupo ?? 'abierto',
    fecha_salida: api.fecha_salida ?? api.fecha_inicio ?? null,
    conductor_id: api.conductor_id,

    conductor: api.conductor,
    capacidad_total: capacidadTotal,
    destino: api.destino,
    cupos_usados: api.cupos_usados,
  };
}

export async function listGroups(params?: { estado?: string; q?: string }) {
  const res = await axios.get<{ data: any[] }>(`${API_URL}/api/grupos`, { params });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(normalizeGrupo);
}

export async function createGroup(payload: {
  conductor_id: number;
  destino_nombre: string;        // UI envía esto…
  cupos_totales: number;         // …y esto
  lat_destino?: number | null;
  lon_destino?: number | null;
  fecha_salida?: string | null;
  costo_estimado?: number | null;
  notas?: string | null;
}) {
  // Normalizamos a lo que prefiere el backend:
  // - destino_nombre -> destino
  // - cupos_totales  -> capacidad_total
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
  // devolvemos el grupo normalizado para que la UI pueda usarlo directo
  return normalizeGrupo(res.data?.data ?? res.data);
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
  payload: { conductor_id: number; estado?: 'cerrado' | 'cancelado' }
) {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/cerrar`, clean(payload));
  return res.data;
}