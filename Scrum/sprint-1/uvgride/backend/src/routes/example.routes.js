const express = require('express');
const router = express.Router();
const { getMessage } = require('../controllers/example.controller');

router.get('/', getMessage);

module.exports = router;