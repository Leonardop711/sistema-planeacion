require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP sobre Express
const server = http.createServer(app);

// Inicializar WebSockets vinculados al servidor HTTP
initSocket(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Sistema de Planeación Backend v2.0 Activo`);
  console.log(`📡 Servidor escuchando en: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO inicializado y listo para eventos en vivo`);
  console.log(`🛡️  Arquitectura en 3 capas (Controller -> Service -> Repository)`);
  console.log(`====================================================`);
});
