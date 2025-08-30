const router = require('express').Router();
const controller = require('../controllers/fare.controller');

// Si quieres protegerla:
// const requireAuth = require('../middlewares/requireAuth');
// router.post('/fare/estimate', requireAuth, controller.estimate);

router.post('/fare/estimate', controller.estimate);
module.exports = router;
