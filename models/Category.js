const { query } = require('../config/database');

class Category {
  // Obtener todas las categorías
  static async findAll() {
    return await query(
      'SELECT * FROM categorias WHERE activo = TRUE ORDER BY nombre'
    );
  }

  // Buscar por ID
  static async findById(id) {
    const categories = await query(
      'SELECT * FROM categorias WHERE id = ? AND activo = TRUE',
      [id]
    );
    return categories[0];
  }

  // Crear categoría
  static async create(categoryData) {
    const { nombre, descripcion, color } = categoryData;
    
    const result = await query(
      'INSERT INTO categorias (nombre, descripcion, color) VALUES (?, ?, ?)',
      [nombre, descripcion, color || '#3498db']
    );

    return result.insertId;
  }

  // Actualizar categoría
  static async update(id, categoryData) {
    const { nombre, descripcion, color, activo } = categoryData;
    
    const result = await query(
      'UPDATE categorias SET nombre = ?, descripcion = ?, color = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, color, activo, id]
    );

    return result.affectedRows > 0;
  }

  // Eliminar categoría (soft delete)
  static async delete(id) {
    const result = await query(
      'UPDATE categorias SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Category;