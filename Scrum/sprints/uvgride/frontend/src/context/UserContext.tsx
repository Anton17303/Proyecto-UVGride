import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
  age?: number;
  telefono?: string;
  tipo_usuario?: string;
  photo?: string;
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  setUserFromBackend: (data: any) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  setUserFromBackend: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const setUserFromBackend = (data: any) => {
    if (!data || typeof data !== 'object') {
      console.error('❌ Datos inválidos recibidos para el usuario:', data);
      return;
    }

    const { id_usuario, nombre, correo_institucional } = data;

    if (!id_usuario || !nombre || !correo_institucional) {
      console.error('❌ Faltan datos obligatorios del usuario:', data);
      return;
    }

    const mappedUser: User = {
      id: id_usuario,
      name: nombre,
      email: correo_institucional,
    };

    console.log('✅ Usuario mapeado correctamente:', mappedUser);
    setUser(mappedUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser, setUserFromBackend }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);