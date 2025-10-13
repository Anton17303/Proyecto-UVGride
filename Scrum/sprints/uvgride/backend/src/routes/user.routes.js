// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../controllers/auth.middleware');
const { uploadAvatar } = require('../controllers/avatar.middleware');

const {
  getUserProfile,
  updateUserProfile,
  getMe,
  updateMe,
  updateMyAvatar,
} = require('../controllers/user.controller');

// Rutas basadas en el usuario autenticado (alias): ¡defínelas antes de '/:id'!
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.put('/me/avatar', authMiddleware, uploadAvatar.single('avatar'), updateMyAvatar);

// Rutas existentes por id (se mantienen para compatibilidad/admin)
router.get('/:id', authMiddleware, getUserProfile);
router.put('/:id', authMiddleware, updateUserProfile);

module.exports = router;
