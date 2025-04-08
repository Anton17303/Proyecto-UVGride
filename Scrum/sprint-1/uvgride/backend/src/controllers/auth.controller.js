// Usuarios simulados
const users = [
    { id: 1, email: 'paco@uvg.com', password: '1234', name: 'Paco' },
    { id: 2, email: 'paca@uvg.com', password: '4321', name: 'Paca' },
  ];
  
  exports.login = (req, res) => {
    const { email, password } = req.body;
  
    const user = users.find(u => u.email === email && u.password === password);
  
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
  
    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: 'fake-jwt-token-123',
      },
    });
  };