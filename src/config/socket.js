const { Server } = require('socket.io');

let io = null;

/**
 * Inicializa Socket.IO vinculado al servidor HTTP
 * @param {import('http').Server} server 
 */
function initSocket(server) {
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado vía WebSocket: ${socket.id}`);

    // Unirse a room de usuario individual
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Unirse a room de dependencia
    socket.on('join_dependency', (depId) => {
      if (depId) {
        socket.join(`dep_${depId}`);
      }
    });

    // Unirse a room de dirección específica
    socket.on('join_direccion', (dirId) => {
      if (dirId) {
        socket.join(`dir_${dirId}`);
      }
    });

    // Unirse a la sala general de Planeación (Revisores)
    socket.on('join_planeacion', () => {
      socket.join('planeacion');
    });

    // Soporte para rooms genéricos del frontend legacy
    socket.on('join_room', (roomName) => {
      if (roomName) {
        socket.join(roomName);
      }
    });

    socket.on('disconnect', () => {
      // Desconexión limpia
    });
  });

  return io;
}

/**
 * Obtiene la instancia activa de Socket.IO
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado. Llama a initSocket(server) primero.');
  }
  return io;
}

/**
 * Emite un evento a un usuario específico
 */
function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user_${userId}`).to(userId.toString()).emit(event, data);
  }
}

/**
 * Emite un evento a todos los miembros de una dependencia
 */
function emitToDependency(depId, event, data) {
  if (io && depId) {
    io.to(`dep_${depId}`).to(depId.toString()).emit(event, data);
  }
}

/**
 * Emite un evento a una dirección de área específica
 */
function emitToDireccion(dirId, event, data) {
  if (io && dirId) {
    io.to(`dir_${dirId}`).to(dirId.toString()).emit(event, data);
  }
}

/**
 * Emite un evento a la sala central de evaluadores de Planeación
 */
function emitToPlaneacion(event, data) {
  if (io) {
    io.to('planeacion').emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToDependency,
  emitToDireccion,
  emitToPlaneacion
};
