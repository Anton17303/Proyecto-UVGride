// src/controllers/auth.middleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1) Intentar con Bearer JWT
  const authHeader = req.headers.authorization || req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Acepta distintas formas comunes de payload
      const id =
        Number(decoded.id_usuario ?? decoded.id ?? decoded.userId ?? decoded.sub);

      if (!Number.isFinite(id) || id <= 0) {
        return res.status(401).json({ error: 'Token inválido (sin id_usuario válido)' });
      }

      req.user = { id_usuario: id };
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  // 2) Fallback DEV: header x-user-id (mientras no uses JWT en el cliente)
  const devId = req.header('x-user-id');
  if (devId) {
    const id = parseInt(devId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(401).json({ error: 'x-user-id inválido' });
    }
    req.user = { id_usuario: id };
    return next();
  }

  // 3) Si no hay credenciales
  return res.status(401).json({ error: 'Acceso no autorizado' });
};
