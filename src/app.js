const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');

// Rutas modulares
const authRoutes = require('./modules/auth/authRoutes');
const dependenciasRoutes = require('./modules/dependencias/dependenciasRoutes');
const notificacionesRoutes = require('./modules/notificaciones/notificacionesRoutes');

const app = express();

// 1. Middlewares Globales de Seguridad
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman o curl) o en la lista permitida
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por directivas de CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Limitador de Peticiones (Anti DoS y Fuerza Bruta)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,                  // 300 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Límite de peticiones excedido. Intenta más tarde.' }
});

app.use('/api/', apiLimiter);

// 3. Montaje de Rutas Modulares
app.use('/api/auth', authRoutes);
app.use('/api/dependencias', dependenciasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// 4. Endpoint de Salud (Health Check)
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS db_time, current_database() AS db_name');
    res.json({
      status: 'ok',
      service: 'Sistema de Planeación Backend v2.0',
      database: result.rows[0].db_name,
      db_time: result.rows[0].db_time
    });
  } catch (err) {
    console.error('❌ Error en health check:', err.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error de conexión con la base de datos',
      detail: err.message
    });
  }
});

// 5. Manejador de Rutas No Encontradas (404)
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// 6. Manejador Global de Errores (500)
app.use((err, req, res, next) => {
  console.error('💥 Error no controlado en la aplicación:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
