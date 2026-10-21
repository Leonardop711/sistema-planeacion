const { Pool } = require('pg');
require('dotenv').config();

// Construcción inteligente de la cadena de conexión
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'postgres';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || process.env.DATABASE || 'sistema_planeacion';

const connectionString = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

console.log(`🔌 Conectando a PostgreSQL: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);

// Determinar si se requiere SSL (ej. para RDS con SSL o Railway con SSL)
// En Docker o local se mantiene desactivado (false) para evitar errores de handshake
const useSSL = process.env.DB_SSL === 'true' || (connectionString && connectionString.includes('sslmode=require'));

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = {
  /**
   * Ejecuta una consulta directa parametrizada
   * @param {string} text Sentencia SQL
   * @param {Array} params Parámetros sanitizados
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Obtiene un cliente dedicado del pool (debe liberarse con client.release())
   */
  getClient: () => pool.connect(),

  /**
   * Ejecuta una transacción atómica segura con BEGIN, COMMIT y ROLLBACK automático
   * @param {Function} callback Función asíncrona que recibe el client
   */
  withTransaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('⚠️ Transacción revertida (ROLLBACK):', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
};
