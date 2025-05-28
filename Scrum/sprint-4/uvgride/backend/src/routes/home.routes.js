const express = require('express');
const router = express.Router();
const { getHomeData } = require('../controllers/home.controller');
const authMiddleware = require('../controllers/auth.middleware');

router.get('/', authMiddleware, getHomeData);

module.exports = router;