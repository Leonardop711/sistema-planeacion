const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ ADVERTENCIA: DATABASE_URL no está definida en las variables de entorno.");
}

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
