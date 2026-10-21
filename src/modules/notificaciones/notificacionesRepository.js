const db = require('../../config/db');

class NotificacionesRepository {
  async getByUserOrDependency({ userId, dependencyId, direccionId, limit = 50 }) {
    const query = `
      SELECT id, user_id, dependency_id, direccion_id, tipo, titulo, mensaje, link, leida, created_at
      FROM seguridad.notifications
      WHERE (user_id = $1 OR dependency_id = $2 OR direccion_id = $3)
      ORDER BY created_at DESC
      LIMIT $4;
    `;
    const result = await db.query(query, [userId || null, dependencyId || null, direccionId || null, limit]);
    return result.rows;
  }

  async createNotification({ userId, dependencyId, direccionId, tipo, titulo, mensaje, link }) {
    const query = `
      INSERT INTO seguridad.notifications (user_id, dependency_id, direccion_id, tipo, titulo, mensaje, link)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await db.query(query, [
      userId || null,
      dependencyId || null,
      direccionId || null,
      tipo,
      titulo,
      mensaje,
      link || null
    ]);
    return result.rows[0];
  }

  async markAsRead(id, userId) {
    const query = `
      UPDATE seguridad.notifications
      SET leida = true
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      RETURNING id, leida;
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }

  async markAllAsRead({ userId, dependencyId, direccionId }) {
    const query = `
      UPDATE seguridad.notifications
      SET leida = true
      WHERE leida = false AND (user_id = $1 OR dependency_id = $2 OR direccion_id = $3);
    `;
    await db.query(query, [userId || null, dependencyId || null, direccionId || null]);
  }
}

module.exports = new NotificacionesRepository();
