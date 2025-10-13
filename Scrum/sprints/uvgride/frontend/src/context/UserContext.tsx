// src/context/UserContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API_URL } from '../services/api';

type User = {
  id: number;                 // id_usuario
  name: string;               // nombre
  lastName?: string;          // apellido
  email: string;              // correo_institucional
  telefono?: string;
  tipo_usuario?: string;      // 'pasajero' | 'conductor'
  photo?: string | null;      // URL absoluta para <Image>
  photoPath?: string | null;  // ruta relativa del backend: /static/avatars/...
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  setUserFromBackend: (data: any) => void;
  mergeUser: (patch: Partial<User>) => void; // útil tras editar perfil
};

// Construye URL absoluta para avatar.
// Si API_URL termina en /api, la recortamos para servir archivos estáticos.
function buildPhotoUrl(avatar_url?: string | null) {
  if (!avatar_url) return null;
  const base = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
  return `${base}${avatar_url}`;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const setUserFromBackend = (data: any) => {
    if (!data || typeof data !== 'object') {
      console.error('❌ Datos inválidos recibidos para el usuario:', data);
      return;
    }

    const {
      id_usuario,
      nombre,
      apellido,
      correo_institucional,
      telefono,
      tipo_usuario,
      avatar_url,
    } = data;

    if (!id_usuario || !nombre || !correo_institucional) {
      console.error('❌ Faltan datos obligatorios del usuario:', data);
      return;
    }

    const mappedUser: User = {
      id: Number(id_usuario),
      name: String(nombre),
      lastName: apellido ? String(apellido) : undefined,
      email: String(correo_institucional),
      telefono: telefono ? String(telefono) : undefined,
      tipo_usuario: tipo_usuario ? String(tipo_usuario).toLowerCase() : undefined,
      photo: buildPhotoUrl(avatar_url),
      photoPath: avatar_url ?? null,
    };

    console.log('✅ Usuario mapeado correctamente:', mappedUser);
    setUser(mappedUser);
  };

  // Para actualizar solo algunos campos (ej. tras PUT /me o /me/avatar)
  const mergeUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <UserContext.Provider value={{ user, setUser, setUserFromBackend, mergeUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de un <UserProvider>');
  }
  return context;
};
