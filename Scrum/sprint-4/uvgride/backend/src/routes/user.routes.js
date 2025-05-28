const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/:id', authMiddleware, userController.getUserProfile);
router.put('/:id', authMiddleware, userController.updateUserProfile);

module.exports = router;