import React from 'react';
import { render } from '@testing-library/react-native';
import PaymentScreen from '../src/screens/PaymentScreen';
import { UserProvider } from '../src/context/UserContext';

describe('PaymentScreen', () => {
  it('renders form inputs', () => {
    const { getByText } = render(
      <UserProvider>
        <PaymentScreen />
      </UserProvider>
    );

    expect(getByText('Monto')).toBeTruthy();
  });
});
