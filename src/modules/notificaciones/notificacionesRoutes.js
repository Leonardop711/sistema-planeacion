const express = require('express');
const router = express.Router();
const notificacionesController = require('./notificacionesController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', notificacionesController.listar);
router.put('/:id/leida', notificacionesController.marcarLeida);
router.put('/marcar-todas', notificacionesController.marcarTodasLeidas);

module.exports = router;
