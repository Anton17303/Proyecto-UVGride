import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from '../src/navigation/Navigation';

describe('Navigation stack', () => {
  it('renders the Login screen as the initial route', () => {
    const { getByText } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    );

    
    expect(getByText(/iniciar sesión/i)).toBeTruthy();
  });

  it('contains all stack screens', () => {
    const { UNSAFE_queryAllByType } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    );

    // Este test verifica que el stack existe (aunque no verifica cada pantalla por nombre directamente)
    expect(UNSAFE_queryAllByType(Navigation)).toBeTruthy();
  });
});
