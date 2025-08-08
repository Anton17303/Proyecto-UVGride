const express = require('express');
const router = express.Router();
const { getDriverPublicProfile } = require('../controllers/driver.controller');

router.get('/perfil-publico/:id', getDriverPublicProfile);

module.exports = router;
