// src/services/groups.ts
import axios from 'axios';
import { API_URL } from './api';

/* =========================
   Tipos: Grupos
   ========================= */

export type GrupoMiembro = {
  id_grupo_miembro: number;
  id_usuario: number;
  rol: 'conductor' | 'pasajero';
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado' | 'baja';
  joined_at: string | null;
  usuario?: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    telefono?: string;
  };
};

export type Grupo = {
  id_grupo: number;

  // Destino normalizado
  destino_nombre: string;
  lat_destino: number | null;
  lon_destino: number | null;

  // cupos
  cupos_totales: number;
  cupos_disponibles: number;
  cupos_usados?: number;

  // costos/estado/fechas
  costo_estimado: number | null; // compat
  precio_base?: number | null;   // preferido
  estado: 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
  fecha_salida: string | null;

  // relaciones
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
  miembros?: GrupoMiembro[];

  // flags calculados por backend (si mandas user_id)
  es_miembro?: boolean;
  es_propietario?: boolean;

  // NUEVO
  es_recurrente?: boolean;

  // compat extras
  capacidad_total?: number;
  destino?: string;

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

/* =========================
   Tipos: Calificaciones por GRUPO (legacy)
   ========================= */

export type RatingItem = {
  id_calificacion_maestro: number;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  rater_nombre: string;
  rater_apellido: string;
};

export type RatingListResponse = {
  count: number;
  rows: RatingItem[];
  limit: number;
  offset: number;
};

export type RatingSummary = {
  conductorId: number;
  nombre: string;
  apellido: string;
  avg: number;   // promedio
  count: number; // total
};

/* =========================
   Tipos: Calificación GLOBAL de conductor (nuevos)
   ========================= */

export type DriverRatingRow = {
  id_calificacion: number;           // id interno devuelto por backend
  conductor_id: number;
  pasajero_id: number;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  pasajero: {
    id_usuario: number;
    nombre: string;
    apellido: string;
  } | null;
};

export type DriverRatingsList = {
  total: number;
  limit: number;
  offset: number;
  data: DriverRatingRow[];
};

export type DriverRatingSummary = {
  promedio: number;
  total: number;
};

/* =========================
   Utilidades
   ========================= */

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (['true', 't', '1'].includes(s)) return true;
    if (['false', 'f', '0'].includes(s)) return false;
  }
  return undefined;
}

/** Normaliza item de API -> Grupo */
function normalizeGrupo(api: any): Grupo {
  const capacidadTotalRaw =
    toNum(api.capacidad_total) ??
    toNum(api.cupos_totales) ??
    0;

  const capacidadTotal = Math.max(Number(capacidadTotalRaw || 0), 0);

  const cuposUsadosRaw = toNum(api.cupos_usados);
  const cuposUsados = cuposUsadosRaw !== null ? Math.max(Number(cuposUsadosRaw), 0) : undefined;

  const cuposDisponiblesRaw =
    toNum(api.cupos_disponibles) ??
    (cuposUsados !== undefined ? capacidadTotal - cuposUsados : capacidadTotal);

  const cuposDisponibles = Math.max(Number(cuposDisponiblesRaw || 0), 0);

  const estado: Grupo['estado'] =
    (api.estado as any) ||
    (api.estado_grupo as any) ||
    'abierto';

  const destinoTexto =
    api.viaje?.destino ??
    api.destino ??
    api.destino_nombre ??
    '';

  // Normalizar miembros (si vienen)
  const miembros: GrupoMiembro[] | undefined = Array.isArray(api.miembros)
    ? api.miembros.map((m: any) => ({
        id_grupo_miembro: Number(m.id_grupo_miembro),
        id_usuario: Number(m.id_usuario),
        rol: (m.rol as GrupoMiembro['rol']) ?? 'pasajero',
        estado_solicitud:
          (m.estado_solicitud as GrupoMiembro['estado_solicitud']) ?? 'pendiente',
        joined_at: m.joined_at ?? null,
        usuario: m.usuario
          ? {
              id_usuario: Number(m.usuario.id_usuario),
              nombre: m.usuario.nombre ?? '',
              apellido: m.usuario.apellido ?? '',
              telefono: m.usuario.telefono ?? undefined,
            }
          : undefined,
      }))
    : undefined;

  // Precios
  const precioBase = toNum(api.precio_base);
  const costoEstimado = toNum(api.costo_estimado);

  return {
    id_grupo: Number(api.id_grupo),

    destino_nombre: String(destinoTexto || ''),
    lat_destino: toNum(api.viaje?.lat_destino ?? api.lat_destino),
    lon_destino: toNum(api.viaje?.lon_destino ?? api.lon_destino),

    cupos_totales: capacidadTotal,
    cupos_disponibles: cuposDisponibles,
    cupos_usados: cuposUsados,

    // mantenemos ambos campos (el UI usa fallback)
    precio_base: precioBase,
    costo_estimado: costoEstimado ?? precioBase ?? null,

    estado,
    fecha_salida: api.viaje?.fecha_inicio ?? api.fecha_salida ?? null,

    conductor_id: Number(api.conductor_id),
    conductor: api.conductor,

    // NUEVO flag
    es_recurrente: toBool(api.es_recurrente),

    capacidad_total: capacidadTotal,
    destino: api.destino,

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

    miembros,

    es_miembro: toBool(api.es_miembro),
    es_propietario: toBool(api.es_propietario),
  };
}

/* =========================
   API: Grupos
   ========================= */

/** GET /api/grupos?estado=&q=&user_id= */
export async function listGroups(params?: { estado?: string; q?: string; user_id?: number }): Promise<Grupo[]> {
  const res = await axios.get<{ data: any[] }>(`${API_URL}/api/grupos`, { params });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(normalizeGrupo);
}

/** GET /api/grupos/:id  (opcional: ?user_id=) */
export async function getGroup(id: number, params?: { user_id?: number }): Promise<Grupo> {
  const res = await axios.get<{ data: any }>(`${API_URL}/api/grupos/${id}`, { params });
  const g = res.data?.data ?? res.data;
  return normalizeGrupo(g);
}

/** POST /api/grupos
 *  Respuesta: { message, data: { id_grupo, id_viaje_maestro } }
 */
export async function createGroup(payload: {
  conductor_id: number;
  destino_nombre: string;
  cupos_totales: number; // cupos de PASAJEROS
  lat_destino?: number | null;
  lon_destino?: number | null;
  fecha_salida?: string | null;
  precio_base?: number | null;       // preferido
  costo_estimado?: number | null;    // compat
  notas?: string | null;
  es_recurrente?: boolean;           // NUEVO
  miembros_designados?: number[];    // NUEVO (IDs)
}): Promise<{ id_grupo: number; id_viaje_maestro: number }> {
  const body = clean({
    conductor_id: payload.conductor_id,
    destino: payload.destino_nombre?.trim(),
    // backend espera capacidad_total (lo normaliza a capacidad_total/cupos_totales)
    capacidad_total: payload.cupos_totales,
    lat_destino: payload.lat_destino ?? undefined,
    lon_destino: payload.lon_destino ?? undefined,
    fecha_salida: payload.fecha_salida ?? undefined,
    // Enviamos ambos alias de precio por compatibilidad
    precio_base: payload.precio_base ?? payload.costo_estimado ?? undefined,
    costo_estimado: payload.costo_estimado ?? payload.precio_base ?? undefined,
    notas: payload.notas ?? undefined,
    es_recurrente: payload.es_recurrente ?? undefined,
    miembros_designados:
      Array.isArray(payload.miembros_designados) && payload.miembros_designados.length > 0
        ? payload.miembros_designados
        : undefined,
  });

  const res = await axios.post(`${API_URL}/api/grupos`, body);
  return (res.data?.data ?? res.data) as { id_grupo: number; id_viaje_maestro: number };
}

/** DELETE /api/grupos/:id   (body: { conductor_id }) */
export async function deleteGroup(
  groupId: number,
  payload: { conductor_id: number }
): Promise<{ message: string }> {
  const res = await axios.delete(`${API_URL}/api/grupos/${groupId}`, { data: clean(payload) });
  return res.data;
}

/** POST /api/grupos/:id/join */
export async function joinGroup(
  groupId: number,
  payload: { id_usuario: number; monto_acordado?: number | null }
): Promise<{ message: string }> {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/join`, clean(payload));
  return res.data;
}

/** POST /api/grupos/:id/leave */
export async function leaveGroup(
  groupId: number,
  payload: { id_usuario: number }
): Promise<{ message: string }> {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/leave`, clean(payload));
  return res.data;
}

/** POST /api/grupos/:id/cerrar (cerrado|cancelado|finalizado) */
export async function closeGroup(
  groupId: number,
  payload: { conductor_id: number; estado?: 'cerrado' | 'cancelado' | 'finalizado' }
): Promise<{ message: string; data?: any }> {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/cerrar`, clean(payload));
  return res.data;
}

/* =========================================================
   API: Calificaciones por GRUPO (legacy / compat)
   ========================================================= */

/** POST /api/grupos/:id/calificaciones
 *  ⚠️ Legacy: mantener solo si aún se usa en algún lugar.
 */
export async function rateDriver(
  groupId: number,
  payload: { id_usuario: number; puntuacion: number; comentario?: string }
): Promise<{ data: any }> {
  const res = await axios.post(`${API_URL}/api/grupos/${groupId}/calificaciones`, clean(payload));
  return res.data;
}

/** GET /api/grupos/:id/calificaciones?limit=&offset= */
export async function listRatings(
  groupId: number,
  params?: { limit?: number; offset?: number }
): Promise<RatingListResponse> {
  const res = await axios.get<RatingListResponse>(`${API_URL}/api/grupos/${groupId}/calificaciones`, { params });
  return res.data;
}

/** GET /api/grupos/:id/calificacion-resumen */
export async function getRatingSummary(groupId: number): Promise<RatingSummary> {
  const res = await axios.get<RatingSummary>(`${API_URL}/api/grupos/${groupId}/calificacion-resumen`);
  return res.data;
}

/* =========================================================
   API: Calificación GLOBAL de conductor (nuevos)
   ========================================================= */

/** POST /api/conductores/:driverId/calificar
 *  Crea/actualiza la calificación global (única por pasajero→conductor).
 */
export async function rateDriverSimple(
  driverId: number,
  payload: { pasajero_id: number; puntuacion: number; comentario?: string }
): Promise<{ data: any }> {
  const res = await axios.post(`${API_URL}/api/conductores/${driverId}/calificar`, clean(payload));
  return res.data;
}

/** GET /api/conductores/:driverId/calificacion-resumen
 *  Devuelve { promedio, total }
 */
export async function getDriverRatingSummary(
  driverId: number
): Promise<DriverRatingSummary> {
  const res = await axios.get<DriverRatingSummary>(`${API_URL}/api/conductores/${driverId}/calificacion-resumen`);
  return res.data;
}

/** GET /api/conductores/:driverId/calificaciones?limit=&offset=
 *  Lista paginada de calificaciones globales para un conductor.
 */
export async function listDriverRatings(
  driverId: number,
  params?: { limit?: number; offset?: number }
): Promise<DriverRatingsList> {
  const res = await axios.get<DriverRatingsList>(`${API_URL}/api/conductores/${driverId}/calificaciones`, { params });
  return res.data;
}
