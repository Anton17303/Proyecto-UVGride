import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from '../src/navigation/BottomTabs';

describe('BottomTabs', () => {
  it('renders all tabs correctly', async () => {
    const { getByText, getAllByTestId } = render(
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    );

// Verifica que los íconos de las pestañas están presentes
    const icons = getAllByTestId('tab-icon');
    expect(icons.length).toBe(3); // Asegúrate de que haya 3 íconos, uno por pestaña
  });
});