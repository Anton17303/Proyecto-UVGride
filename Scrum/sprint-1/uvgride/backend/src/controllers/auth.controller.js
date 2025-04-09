const users = require('../data/users');

exports.register = (req, res) => {
  const { name, age, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }

  const newUser = {
    id: users.length + 1,
    name,
    age,
    email,
    password,
  };

  users.push(newUser);

  res.status(201).json({ message: 'Usuario registrado', user: newUser });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({
    message: 'Login exitoso',
    user,
  });
};
