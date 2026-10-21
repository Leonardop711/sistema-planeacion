const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRepository = require('./authRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_para_planeacion_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

class AuthService {
  async login(email, password, ip, userAgent) {
    if (!email || !password) {
      throw new Error('Debes proporcionar usuario/correo y contraseña');
    }

    const cleanEmail = email.trim();

    // Comprobar intentos fallidos recientes para mitigar fuerza bruta
    const failedAttempts = await authRepository.getRecentFailedAttempts(cleanEmail, 15);
    if (failedAttempts >= 8) {
      await authRepository.logAudit('LOGIN_BLOCKED', null, cleanEmail, null, 'Cuenta temporalmente bloqueada por exceso de intentos fallidos', ip, userAgent, false);
      throw new Error('Demasiados intentos fallidos. Por favor espera 15 minutos antes de volver a intentar.');
    }

    const user = await authRepository.findUserByEmail(cleanEmail);

    if (!user) {
      await authRepository.logAttempt(cleanEmail, false, ip);
      await authRepository.logAudit('LOGIN_FAILED', null, cleanEmail, null, 'Usuario no encontrado', ip, userAgent, false);
      throw new Error('Credenciales incorrectas');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      await authRepository.logAttempt(cleanEmail, false, ip);
      await authRepository.logAudit('LOGIN_FAILED', user.id, cleanEmail, user.role_code, 'Contraseña incorrecta', ip, userAgent, false);
      throw new Error('Credenciales incorrectas');
    }

    // Registrar intento exitoso
    await authRepository.logAttempt(cleanEmail, true, ip);

    // Generar nuevo token único de sesión (para invalidar sesiones previas si se desea)
    const sessionToken = crypto.randomBytes(24).toString('hex');
    await authRepository.updateSessionToken(user.id, sessionToken);

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_code,
        level: user.role_level,
        dependency_id: user.dependency_id,
        direccion_id: user.direccion_id,
        sessionToken
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await authRepository.logAudit('LOGIN_SUCCESS', user.id, cleanEmail, user.role_code, 'Inicio de sesión exitoso', ip, userAgent, true);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cargo: user.cargo,
        role_code: user.role_code,
        role_name: user.role_name,
        dependency_id: user.dependency_id,
        dependencia: user.dependencia_nombre,
        direccion_id: user.direccion_id,
        direccion: user.direccion_nombre,
        can_edit: user.can_edit,
        can_approve: user.can_approve,
        is_global: user.is_global
      }
    };
  }

  async getCurrentUser(userId) {
    const user = await authRepository.getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  async logout(userId, ip, userAgent) {
    await authRepository.updateSessionToken(userId, null);
    await authRepository.logAudit('LOGOUT', userId, null, null, 'Cierre de sesión manual', ip, userAgent, true);
    return { status: 'ok', message: 'Sesión finalizada exitosamente' };
  }
}

module.exports = new AuthService();
