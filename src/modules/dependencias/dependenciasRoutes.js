const express = require('express');
const router = express.Router();
const dependenciasController = require('./dependenciasController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { authorizeRoles, requireEditPermission } = require('../../middlewares/roleMiddleware');

// Listar y consultar dependencias (cualquier usuario autenticado)
router.get('/', authMiddleware, dependenciasController.listar);
router.get('/:id', authMiddleware, dependenciasController.obtener);

// Crear dependencias (Solo administradores)
router.post('/', authMiddleware, authorizeRoles('admin'), dependenciasController.crearDependencia);

// Crear direcciones (Solo administradores o revisores)
router.post('/direcciones', authMiddleware, requireEditPermission, dependenciasController.crearDireccion);

module.exports = router;
