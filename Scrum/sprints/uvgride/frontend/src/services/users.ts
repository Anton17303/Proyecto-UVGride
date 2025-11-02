// src/services/users.ts
import axios, { AxiosRequestConfig } from "axios";
import { API_URL } from "./api";

export type UserLite = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_institucional?: string | null;
  tipo_usuario?: string | null;
};

function mapUser(u: any): UserLite | null {
  const id =
    Number(u?.id_usuario) ??
    Number(u?.id) ??
    Number(u?.user_id) ??
    Number(u?.uid);
  if (!Number.isFinite(id)) return null;

  const nombre =
    (u?.nombre ?? u?.first_name ?? u?.firstname ?? u?.given_name ?? "").toString();
  const apellido =
    (u?.apellido ?? u?.last_name ?? u?.lastname ?? u?.family_name ?? "").toString();

  const correo =
    u?.correo_institucional ?? u?.email ?? u?.correo ?? u?.mail ?? null;

  const tipo = u?.tipo_usuario ?? u?.role ?? u?.tipo ?? null;

  return {
    id_usuario: id,
    nombre,
    apellido,
    correo_institucional: correo || null,
    tipo_usuario: tipo || null,
  };
}

function pickArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  return [];
}

function buildAuthConfig(extra?: { token?: string; userId?: number }): AxiosRequestConfig {
  const headers: Record<string, string> = {};

  // ✅ Soporte dev: x-user-id (tu middleware lo acepta)
  if (extra?.userId && Number.isFinite(extra.userId)) {
    headers["x-user-id"] = String(extra.userId);
  }

  // (Opcional) JWT si en algún momento lo usas
  const token =
    extra?.token ||
    (axios.defaults.headers?.common?.Authorization as string)?.replace(/^Bearer\s+/i, "") ||
    (axios.defaults.headers?.common?.authorization as string)?.replace(/^Bearer\s+/i, "") ||
    "";
  if (token) headers.Authorization = `Bearer ${token}`;

  return { headers, withCredentials: true };
}

/**
 * Busca usuarios por nombre/apellido/correo.
 * - Preferido: GET /api/users/search?q=&limit=
 * - Fallback:  GET /api/users?q=&limit=
 * IMPORTANTE: si no usas JWT, pasa { userId } para enviar x-user-id.
 */
export async function searchUsers(
  q: string,
  limit = 10,
  opts?: { token?: string; userId?: number }
): Promise<UserLite[]> {
  const params = { q: q?.trim() || "", limit };
  if (!params.q) return [];

  const config = buildAuthConfig(opts);

  try {
    const res = await axios.get(`${API_URL}/api/users/search`, { ...config, params });
    const arr = pickArray(res.data);
    return arr.map(mapUser).filter(Boolean) as UserLite[];
  } catch (e: any) {
    // Si no existe /search o hay otro error, probamos fallback
  }

  try {
    const res2 = await axios.get(`${API_URL}/api/users`, { ...config, params });
    const arr2 = pickArray(res2.data);
    return arr2.map(mapUser).filter(Boolean) as UserLite[];
  } catch (e: any) {
    return [];
  }
}
