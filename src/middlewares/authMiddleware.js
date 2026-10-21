const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_para_planeacion_cambiar_en_produccion';

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'Acceso no autorizado: Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Acceso no autorizado: Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validar usuario en base de datos y verificar que siga activo
    const query = `
      SELECT u.id, u.name, u.email, u.cargo, u.tipo_enlace, u.activo,
             u.dependency_id, u.direccion_id, u.session_token, u.permisos_menu,
             r.code as role_code, r.name as role_name, r.level as role_level,
             r.can_edit, r.can_approve, r.is_global,
             d.name as dependencia_nombre,
             dir.name as direccion_nombre
      FROM seguridad.users u
      JOIN seguridad.roles r ON u.role_id = r.id
      LEFT JOIN seguridad.dependencies d ON u.dependency_id = d.id
      LEFT JOIN seguridad.direcciones dir ON u.direccion_id = dir.id
      WHERE u.id = $1
    `;
    const result = await db.query(query, [decoded.id]);
    const user = result.rows[0];

    if (!user || !user.activo) {
      return res.status(401).json({ status: 'error', message: 'Cuenta inactiva o no encontrada' });
    }

    // Comprobar validez de la sesión única (session_token)
    if (decoded.sessionToken && user.session_token && decoded.sessionToken !== user.session_token) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Sesión iniciada en otro dispositivo. Por favor ingresa nuevamente.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Tu sesión ha expirado. Ingresa de nuevo.' });
    }
    return res.status(401).json({ status: 'error', message: 'Token inválido' });
  }
};
