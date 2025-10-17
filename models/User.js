const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class User {
  // Crear usuario
  static async create(userData) {
    const {
      username,
      email,
      password,
      nombre_completo,
      rol = 'Consulta',
      permisos = '[]'
    } = userData;

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol, permisos) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, nombre_completo, rol, JSON.stringify(permisos)]
    );

    return result.insertId;
  }

  // Buscar usuario por username
  static async findByUsername(username) {
    const users = await query(
      'SELECT * FROM usuarios WHERE username = ? AND activo = TRUE',
      [username]
    );
    return users[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const users = await query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );
    return users[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    const users = await query(
      'SELECT id, username, email, nombre_completo, rol, permisos, fecha_creacion FROM usuarios WHERE id = ? AND activo = TRUE',
      [id]
    );
    return users[0];
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtener todos los usuarios
  static async findAll() {
    return await query(
      'SELECT id, username, email, nombre_completo, rol, permisos, activo, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC'
    );
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { username, email, nombre_completo, rol, permisos, activo } = userData;
    
    const result = await query(
      `UPDATE usuarios 
       SET username = ?, email = ?, nombre_completo = ?, rol = ?, permisos = ?, activo = ?
       WHERE id = ?`,
      [username, email, nombre_completo, rol, JSON.stringify(permisos), activo, id]
    );

    return result.affectedRows > 0;
  }

  // Eliminar usuario (soft delete)
  static async delete(id) {
    const result = await query(
      'UPDATE usuarios SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Cambiar contraseña
  static async changePassword(id, newPassword) {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const result = await query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = User;