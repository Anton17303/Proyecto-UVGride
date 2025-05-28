const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, homeController.getHomeData);

module.exports = router;