const notificacionesService = require('./notificacionesService');

class NotificacionesController {
  async listar(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const notifs = await notificacionesService.getNotificaciones(req.user, limit);
      res.json(notifs);
    } catch (err) {
      console.error('Error obteniendo notificaciones:', err);
      res.status(500).json({ status: 'error', message: 'Error interno al consultar notificaciones' });
    }
  }

  async marcarLeida(req, res) {
    try {
      const result = await notificacionesService.marcarLeida(req.params.id, req.user.id);
      res.json({ status: 'ok', data: result });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  async marcarTodasLeidas(req, res) {
    try {
      await notificacionesService.marcarTodasLeidas(req.user);
      res.json({ status: 'ok', message: 'Notificaciones marcadas como leídas' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new NotificacionesController();
