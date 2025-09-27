describe('Stress Test Scroll', () => {
  it('Scrollear lista muchas veces', async () => {
    for (let i = 0; i < 30; i++) {
      await waitFor(element(by.text('Inicio')))
        .toBeVisible()
        .whileElement(by.type('RCTScrollView'))
        .scroll(300, 'down');
    }
  });
});
