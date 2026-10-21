const notificacionesRepository = require('./notificacionesRepository');
const socketConfig = require('../../config/socket');

class NotificacionesService {
  async getNotificaciones(user, limit = 50) {
    return await notificacionesRepository.getByUserOrDependency({
      userId: user.id,
      dependencyId: user.dependency_id,
      direccionId: user.direccion_id,
      limit
    });
  }

  /**
   * Envía una notificación en tiempo real vía WebSockets y opcionalmente persiste en BD
   */
  async enviarNotificacion({ userId, dependencyId, direccionId, tipo, titulo, mensaje, link, persistir = true }) {
    let notif = null;

    // Solo guardar en base de datos si tiene destinatario real y persistir está activo
    if (persistir && (userId || dependencyId || direccionId)) {
      notif = await notificacionesRepository.createNotification({
        userId,
        dependencyId,
        direccionId,
        tipo: tipo || 'alerta',
        titulo,
        mensaje,
        link
      });
    } else {
      // Objeto efímero para envío exclusivo en vivo por socket (no ensucia la BD)
      notif = {
        id: null,
        tipo: tipo || 'alerta',
        titulo,
        mensaje,
        link,
        created_at: new Date().toISOString()
      };
    }

    // Emisión en tiempo real a las salas correspondientes
    try {
      if (userId) {
        socketConfig.emitToUser(userId, 'nueva_notificacion', notif);
      }
      if (dependencyId) {
        socketConfig.emitToDependency(dependencyId, 'nueva_notificacion', notif);
      }
      if (direccionId) {
        socketConfig.emitToDireccion(direccionId, 'nueva_notificacion', notif);
      }
      if (tipo === 'envio_formal' || tipo === 'revision') {
        socketConfig.emitToPlaneacion('nueva_notificacion', notif);
      }
    } catch (socketErr) {
      console.warn('⚠️ No se pudo emitir por WebSockets:', socketErr.message);
    }

    return notif;
  }

  async marcarLeida(id, userId) {
    return await notificacionesRepository.markAsRead(id, userId);
  }

  async marcarTodasLeidas(user) {
    await notificacionesRepository.markAllAsRead({
      userId: user.id,
      dependencyId: user.dependency_id,
      direccionId: user.direccion_id
    });
    return { ok: true };
  }
}

module.exports = new NotificacionesService();
