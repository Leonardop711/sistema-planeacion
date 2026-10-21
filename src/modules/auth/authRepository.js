const db = require('../../config/db');

class AuthRepository {
  async findUserByEmail(email) {
    const query = `
      SELECT u.id, u.name, u.email, u.password_hash, u.cargo, u.tipo_enlace, u.activo,
             u.dependency_id, u.direccion_id, u.session_token, u.permisos_menu,
             r.code as role_code, r.name as role_name, r.level as role_level,
             r.can_edit, r.can_approve, r.is_global,
             d.name as dependencia_nombre,
             dir.name as direccion_nombre
      FROM seguridad.users u
      JOIN seguridad.roles r ON u.role_id = r.id
      LEFT JOIN seguridad.dependencies d ON u.dependency_id = d.id
      LEFT JOIN seguridad.direcciones dir ON u.direccion_id = dir.id
      WHERE LOWER(u.email) = LOWER($1) AND u.activo = true
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = `
      SELECT u.id, u.name, u.email, u.cargo, u.tipo_enlace, u.activo,
             u.dependency_id, u.direccion_id, u.permisos_menu,
             r.code as role_code, r.name as role_name, r.level as role_level,
             r.can_edit, r.can_approve, r.is_global,
             d.name as dependencia_nombre, d.titular as dependencia_titular,
             dir.name as direccion_nombre, dir.titular as direccion_titular
      FROM seguridad.users u
      JOIN seguridad.roles r ON u.role_id = r.id
      LEFT JOIN seguridad.dependencies d ON u.dependency_id = d.id
      LEFT JOIN seguridad.direcciones dir ON u.direccion_id = dir.id
      WHERE u.id = $1 AND u.activo = true
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async updateSessionToken(userId, token) {
    await db.query(
      'UPDATE seguridad.users SET session_token = $1 WHERE id = $2',
      [token, userId]
    );
  }

  async logAttempt(email, isSuccess, ip) {
    await db.query(
      'INSERT INTO seguridad.intentos_fallidos (email, exitoso, ip) VALUES ($1, $2, $3)',
      [email, isSuccess, ip]
    );
  }

  async logAudit(action, userId, email, role, details, ip, userAgent, isSuccess = true) {
    await db.query(
      `INSERT INTO auditoria.logs (accion, user_id, email, rol, detalles, ip, user_agent, exitoso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [action, userId || null, email, role || null, details, ip, userAgent, isSuccess]
    );
  }

  async getRecentFailedAttempts(email, minutes = 15) {
    const result = await db.query(
      `SELECT COUNT(*) as total 
       FROM seguridad.intentos_fallidos 
       WHERE email = $1 AND exitoso = false AND fecha_intento >= now() - ($2 || ' minutes')::interval`,
      [email, minutes]
    );
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = new AuthRepository();
