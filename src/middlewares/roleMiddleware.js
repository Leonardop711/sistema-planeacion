/**
 * Middleware para autorizar acceso basado en una lista de roles permitidos
 * @param  {...string} allowedRoles Códigos de roles permitidos (ej. 'admin', 'revisor')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_code) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Acceso denegado: No se identificó el rol del usuario.' 
      });
    }

    if (!allowedRoles.includes(req.user.role_code)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Acceso restringido: Se requiere rol [${allowedRoles.join(' o ')}]. Tu rol es '${req.user.role_code}'.` 
      });
    }

    next();
  };
};

/**
 * Middleware que bloquea operaciones de escritura para roles tipo 'viewer'
 */
const requireEditPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autenticado' });
  }

  if (req.user.can_edit === false || req.user.role_code === 'viewer') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Operación denegada: Tu cuenta tiene perfil de Observador (Solo Lectura).' 
    });
  }

  next();
};

/**
 * Middleware que verifica facultad de aprobación formal
 */
const requireApprovalPermission = (req, res, next) => {
  if (!req.user || !req.user.can_approve) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Operación denegada: No cuentas con facultades para dictaminar o aprobar.' 
    });
  }

  next();
};

module.exports = {
  authorizeRoles,
  requireEditPermission,
  requireApprovalPermission
};
