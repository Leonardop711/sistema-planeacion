const dependenciasRepository = require('./dependenciasRepository');
const authRepository = require('../auth/authRepository');

class DependenciasService {
  async getDependencias() {
    return await dependenciasRepository.getAllWithDirecciones();
  }

  async getDependenciaById(id) {
    const dep = await dependenciasRepository.getById(id);
    if (!dep) {
      throw new Error('Dependencia no encontrada');
    }
    return dep;
  }

  async createDependencia(data, user, ip) {
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre de la dependencia es obligatorio');
    }

    const nueva = await dependenciasRepository.createDependencia({
      name: data.name.trim(),
      abreviatura: data.abreviatura?.trim(),
      titular: data.titular?.trim(),
      email_contacto: data.email_contacto?.trim()
    });

    await authRepository.logAudit(
      'CREATE_DEPENDENCIA',
      user?.id,
      user?.email,
      user?.role_code,
      `Creación de dependencia: ${nueva.name}`,
      ip
    );

    return nueva;
  }

  async createDireccion(data, user, ip) {
    if (!data.dependency_id) {
      throw new Error('El ID de la dependencia padre es obligatorio');
    }
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre de la dirección es obligatorio');
    }

    const nueva = await dependenciasRepository.createDireccion({
      dependency_id: data.dependency_id,
      name: data.name.trim(),
      abreviatura: data.abreviatura?.trim(),
      titular: data.titular?.trim(),
      email_contacto: data.email_contacto?.trim()
    });

    await authRepository.logAudit(
      'CREATE_DIRECCION',
      user?.id,
      user?.email,
      user?.role_code,
      `Creación de dirección: ${nueva.name} para dependencia ID ${data.dependency_id}`,
      ip
    );

    return nueva;
  }
}

module.exports = new DependenciasService();
