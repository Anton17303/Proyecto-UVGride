describe('Stress Test Navegación', () => {
  it('Abrir y cerrar pantallas 50 veces', async () => {
    for (let i = 0; i < 50; i++) {
      await element(by.text('Perfil')).tap();   // 👈 usa el texto de tu botón
      await element(by.text('Inicio')).tap();   // 👈 usa el texto del tab/botón de inicio
    }
  });
});
