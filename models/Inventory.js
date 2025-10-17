const { query } = require('../config/database');

class Inventory {
  // Obtener todos los materiales
  static async findAll(filters = {}) {
    let sql = `
      SELECT i.*, c.nombre as categoria_nombre, c.color as categoria_color
      FROM inventario i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      WHERE i.activo = TRUE
    `;
    const params = [];

    // Aplicar filtros
    if (filters.categoria) {
      sql += ' AND c.nombre = ?';
      params.push(filters.categoria);
    }

    if (filters.tipo) {
      sql += ' AND i.tipo = ?';
      params.push(filters.tipo);
    }

    if (filters.estado) {
      sql += ' AND i.estado = ?';
      params.push(filters.estado);
    }

    if (filters.search) {
      sql += ' AND (i.codigo LIKE ? OR i.nombre LIKE ? OR i.descripcion LIKE ? OR i.serial LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY i.fecha_creacion DESC';

    return await query(sql, params);
  }

  // Buscar por ID
  static async findById(id) {
    const items = await query(
      `SELECT i.*, c.nombre as categoria_nombre, c.color as categoria_color
       FROM inventario i
       LEFT JOIN categorias c ON i.categoria_id = c.id
       WHERE i.id = ? AND i.activo = TRUE`,
      [id]
    );
    return items[0];
  }

  // Buscar por código
  static async findByCode(codigo) {
    const items = await query(
      'SELECT * FROM inventario WHERE codigo = ? AND activo = TRUE',
      [codigo]
    );
    return items[0];
  }

  // Crear material
  static async create(materialData) {
    const {
      codigo,
      nombre,
      descripcion,
      categoria_id,
      tipo,
      cantidad,
      serial,
      estado,
      ubicacion,
      fecha_adquisicion,
      valor,
      proveedor,
      notas
    } = materialData;

    const result = await query(
      `INSERT INTO inventario 
       (codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion, fecha_adquisicion, valor, proveedor, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion, categoria_id, tipo, cantidad || 0, serial, estado || 'disponible', ubicacion, fecha_adquisicion, valor, proveedor, notas]
    );

    return result.insertId;
  }

  // Actualizar material
  static async update(id, materialData) {
    const {
      nombre,
      descripcion,
      categoria_id,
      tipo,
      cantidad,
      serial,
      estado,
      ubicacion,
      fecha_adquisicion,
      valor,
      proveedor,
      notas
    } = materialData;

    const result = await query(
      `UPDATE inventario 
       SET nombre = ?, descripcion = ?, categoria_id = ?, tipo = ?, cantidad = ?, serial = ?, estado = ?, ubicacion = ?, fecha_adquisicion = ?, valor = ?, proveedor = ?, notas = ?
       WHERE id = ? AND activo = TRUE`,
      [nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion, fecha_adquisicion, valor, proveedor, notas, id]
    );

    return result.affectedRows > 0;
  }

  // Eliminar material (soft delete)
  static async delete(id) {
    const result = await query(
      'UPDATE inventario SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Obtener estadísticas
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
        SUM(CASE WHEN tipo = 'serializado' THEN 1 ELSE 0 END) as serializados,
        COUNT(DISTINCT categoria_id) as categorias_count
      FROM inventario 
      WHERE activo = TRUE
    `);

    const categorias = await query(`
      SELECT c.nombre, COUNT(i.id) as count
      FROM categorias c
      LEFT JOIN inventario i ON c.id = i.categoria_id AND i.activo = TRUE
      WHERE c.activo = TRUE
      GROUP BY c.id, c.nombre
    `);

    const estados = await query(`
      SELECT estado, COUNT(*) as count
      FROM inventario
      WHERE activo = TRUE
      GROUP BY estado
    `);

    return {
      ...stats[0],
      categorias: categorias.reduce((acc, curr) => {
        acc[curr.nombre] = curr.count;
        return acc;
      }, {}),
      estados: estados.reduce((acc, curr) => {
        acc[curr.estado] = curr.count;
        return acc;
      }, {})
    };
  }

  // Buscar materiales
  static async search(termino) {
    return await query(
      `SELECT i.*, c.nombre as categoria_nombre
       FROM inventario i
       LEFT JOIN categorias c ON i.categoria_id = c.id
       WHERE i.activo = TRUE 
         AND (i.codigo LIKE ? OR i.nombre LIKE ? OR i.descripcion LIKE ? OR i.serial LIKE ?)
       ORDER BY i.fecha_creacion DESC
       LIMIT 50`,
      [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`]
    );
  }
}

module.exports = Inventory;