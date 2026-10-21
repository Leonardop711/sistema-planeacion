const dependenciasService = require('./dependenciasService');

class DependenciasController {
  async listar(req, res) {
    try {
      const data = await dependenciasService.getDependencias();
      res.json(data);
    } catch (err) {
      console.error('Error listando dependencias:', err);
      res.status(500).json({ status: 'error', message: 'Error interno al consultar dependencias' });
    }
  }

  async obtener(req, res) {
    try {
      const data = await dependenciasService.getDependenciaById(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(404).json({ status: 'error', message: err.message });
    }
  }

  async crearDependencia(req, res) {
    try {
      const data = await dependenciasService.createDependencia(req.body, req.user, req.ip);
      res.status(201).json({ status: 'ok', data });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  async crearDireccion(req, res) {
    try {
      const data = await dependenciasService.createDireccion(req.body, req.user, req.ip);
      res.status(201).json({ status: 'ok', data });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new DependenciasController();
