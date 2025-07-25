import React from 'react';
import { render } from '@testing-library/react-native';
import TravelStack from '../src/navigation/TravelStack';
import { NavigationContainer } from '@react-navigation/native';

describe('TravelStack Navigation', () => {
  it('renders TravelScreen', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <TravelStack />
      </NavigationContainer>
    );

    // Asegúrate de que TravelScreen tenga algo reconocible
    expect(await findByText(/viaje/i)).toBeTruthy(); // O texto visible
  });
});
