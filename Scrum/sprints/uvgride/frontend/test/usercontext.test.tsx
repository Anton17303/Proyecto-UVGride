import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserProvider, useUser } from 'context/UserContext'; 

const TestComponent = () => {
  const { user, setUserFromBackend } = useUser();

  React.useEffect(() => {
    const fakeData = {
      id_usuario: 1,
      nombre: 'Ana',
      correo_institucional: 'ana@uvg.edu.gt',
    };
    setUserFromBackend(fakeData);
  }, [setUserFromBackend]);

  return (
    <div>
      {user ? (
        <>
          <p>{user.name}</p>
          <p>{user.email}</p>
        </>
      ) : (
        <p>No user</p>
      )}
    </div>
  );
};

describe('UserContext', () => {
  it('mapea correctamente y muestra los datos del usuario', async () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Verifica que los datos renderizados sean correctos
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(await screen.findByText('ana@uvg.edu.gt')).toBeInTheDocument();
  });

  it('no establece usuario si faltan datos', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const BrokenComponent = () => {
      const { setUserFromBackend, user } = useUser();
      React.useEffect(() => {
        setUserFromBackend({}); 
      }, []);
      return <p>{user ? 'User exists' : 'No user'}</p>;
    };

    render(
      <UserProvider>
        <BrokenComponent />
      </UserProvider>
    );

    expect(screen.getByText('No user')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Faltan datos obligatorios del usuario:',
      {}
    );

    consoleSpy.mockRestore();
  });
});