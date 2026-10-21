const express = require('express');
const router = express.Router();
const authController = require('./authController');
const authMiddleware = require('../../middlewares/authMiddleware');

// Ruta pública de inicio de sesión
router.post('/login', authController.login);

// Rutas protegidas por JWT
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
