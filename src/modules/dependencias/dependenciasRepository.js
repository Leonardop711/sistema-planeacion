const db = require('../../config/db');

class DependenciasRepository {
  /**
   * Obtiene todas las dependencias con sus direcciones anidadas en formato JSON
   */
  async getAllWithDirecciones() {
    const query = `
      SELECT 
        d.id, d.name, d.abreviatura, d.titular, d.email_contacto, d.activa, d.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', dir.id,
              'name', dir.name,
              'abreviatura', dir.abreviatura,
              'titular', dir.titular,
              'email_contacto', dir.email_contacto,
              'activa', dir.activa
            ) ORDER BY dir.name
          ) FILTER (WHERE dir.id IS NOT NULL), '[]'::json
        ) AS direcciones
      FROM seguridad.dependencies d
      LEFT JOIN seguridad.direcciones dir ON dir.dependency_id = d.id AND dir.activa = true
      WHERE d.activa = true
      GROUP BY d.id
      ORDER BY d.name;
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getById(id) {
    const query = `
      SELECT 
        d.id, d.name, d.abreviatura, d.titular, d.email_contacto, d.activa, d.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', dir.id,
              'name', dir.name,
              'abreviatura', dir.abreviatura,
              'titular', dir.titular,
              'email_contacto', dir.email_contacto,
              'activa', dir.activa
            ) ORDER BY dir.name
          ) FILTER (WHERE dir.id IS NOT NULL), '[]'::json
        ) AS direcciones
      FROM seguridad.dependencies d
      LEFT JOIN seguridad.direcciones dir ON dir.dependency_id = d.id
      WHERE d.id = $1
      GROUP BY d.id;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async createDependencia({ name, abreviatura, titular, email_contacto }) {
    const query = `
      INSERT INTO seguridad.dependencies (name, abreviatura, titular, email_contacto)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [name, abreviatura || null, titular || null, email_contacto || null]);
    return result.rows[0];
  }

  async updateDependencia(id, { name, abreviatura, titular, email_contacto }) {
    const query = `
      UPDATE seguridad.dependencies
      SET name = COALESCE($1, name),
          abreviatura = COALESCE($2, abreviatura),
          titular = COALESCE($3, titular),
          email_contacto = COALESCE($4, email_contacto)
      WHERE id = $5
      RETURNING *;
    `;
    const result = await db.query(query, [name, abreviatura, titular, email_contacto, id]);
    return result.rows[0];
  }

  // Métodos de Direcciones
  async createDireccion({ dependency_id, name, abreviatura, titular, email_contacto }) {
    const query = `
      INSERT INTO seguridad.direcciones (dependency_id, name, abreviatura, titular, email_contacto)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query(query, [dependency_id, name, abreviatura || null, titular || null, email_contacto || null]);
    return result.rows[0];
  }

  async updateDireccion(id, { name, abreviatura, titular, email_contacto }) {
    const query = `
      UPDATE seguridad.direcciones
      SET name = COALESCE($1, name),
          abreviatura = COALESCE($2, abreviatura),
          titular = COALESCE($3, titular),
          email_contacto = COALESCE($4, email_contacto)
      WHERE id = $5
      RETURNING *;
    `;
    const result = await db.query(query, [name, abreviatura, titular, email_contacto, id]);
    return result.rows[0];
  }

  async deleteDireccion(id) {
    await db.query('UPDATE seguridad.direcciones SET activa = false WHERE id = $1', [id]);
  }
}

module.exports = new DependenciasRepository();
