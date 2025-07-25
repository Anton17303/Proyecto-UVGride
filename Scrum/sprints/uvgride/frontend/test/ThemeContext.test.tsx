import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeContext, useTheme } from '../src/context/ThemeContext'; 
import userEvent from '@testing-library/user-event';

// Componente de prueba para consumir el contexto
const ThemeConsumerComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  test('proporciona el tema por defecto (light)', () => {
    render(
      <ThemeContext>
        <ThemeConsumerComponent />
      </ThemeContext>
    );

    expect(screen.getByText(/Current theme: light/i)).toBeInTheDocument();
  });

  test('toggleTheme cambia el tema de light a dark y viceversa', async () => {
    render(
      <ThemeContext>
        <ThemeConsumerComponent />
      </ThemeContext>
    );

    const button = screen.getByText(/Toggle Theme/i);
    const user = userEvent.setup();

    // Toggle 1 → dark
    await user.click(button);
    expect(screen.getByText(/Current theme: dark/i)).toBeInTheDocument();

    // Toggle 2 → light
    await user.click(button);
    expect(screen.getByText(/Current theme: light/i)).toBeInTheDocument();
  });

  test('useTheme lanza error si no está dentro del ThemeProvider', () => {
    const renderOutsideProvider = () => {
      const Component = () => {
        useTheme();
        return null;
      };
      render(<Component />);
    };

    expect(renderOutsideProvider).toThrow(
      /useTheme debe usarse dentro de un <ThemeProvider>/
    );
  });
});
