const authService = require('./authService');

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '0.0.0.0';
};

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    try {
      const data = await authService.login(email, password, ip, userAgent);
      res.json({ status: 'ok', ...data });
    } catch (err) {
      if (err.message.includes('Credenciales incorrectas') || err.message.includes('Demasiados intentos')) {
        return res.status(401).json({ status: 'error', message: err.message });
      }
      console.error('Error en login:', err);
      res.status(500).json({ status: 'error', message: 'Error interno del servidor al procesar la autenticación' });
    }
  }

  async me(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json(user);
    } catch (err) {
      console.error('Error obteniendo perfil:', err);
      res.status(404).json({ status: 'error', message: err.message });
    }
  }

  async logout(req, res) {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    try {
      const result = await authService.logout(req.user.id, ip, userAgent);
      res.json(result);
    } catch (err) {
      console.error('Error en logout:', err);
      res.status(500).json({ status: 'error', message: 'Error al cerrar sesión' });
    }
  }
}

module.exports = new AuthController();
