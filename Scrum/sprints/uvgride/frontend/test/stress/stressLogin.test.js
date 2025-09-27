describe('Stress Test Login', () => {
  it('Repetir login/logout varias veces', async () => {
    for (let i = 0; i < 10; i++) {
      await element(by.placeholder('Correo institucional')).replaceText('test@uvg.edu.gt');
      await element(by.placeholder('Contraseña')).replaceText('123456');
      await element(by.text('Iniciar sesión')).tap();

      await waitFor(element(by.text('Inicio')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Cerrar sesión')).tap();
    }
  });
});
